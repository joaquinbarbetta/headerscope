import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import type { TLSSocket } from "node:tls";
import { TargetError, isPublicAddress, validateTarget } from "./ssrf";
import type { FetchResult, HeaderMap, Hop, TlsInfo } from "./types";

export const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 8_000;
const USER_AGENT = "SecHeadersScanner/1.0 (+https://github.com/)";

export interface FetchOptions {
  /** Disable SSRF checks. Only for local tests. */
  allowPrivate?: boolean;
  timeoutMs?: number;
}

/**
 * DNS lookup that refuses to hand non-public addresses to the socket.
 * Because validation happens at connect time on the exact IPs used,
 * a hostname can't pass the check and then re-resolve to 127.0.0.1.
 */
function safeLookup(allowPrivate: boolean): LookupFunction {
  return (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
      if (err) return callback(err, "", 4);
      const list = addresses as dns.LookupAddress[];
      const bad = list.find((a) => !allowPrivate && !isPublicAddress(a.address));
      if (bad || list.length === 0) {
        const e = new TargetError("This host resolves to a private or reserved IP address.");
        return callback(e as NodeJS.ErrnoException, "", 4);
      }
      if (options.all) return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, list);
      callback(null, list[0].address, list[0].family);
    });
  };
}

interface RawResponse {
  status: number;
  headers: HeaderMap;
  tls: TlsInfo | null;
}

function tlsInfo(socket: TLSSocket): TlsInfo {
  const info: TlsInfo = { protocol: socket.getProtocol?.() ?? null };
  const cert = socket.getPeerCertificate?.();
  if (cert && cert.valid_to) {
    info.validTo = new Date(cert.valid_to).toISOString().slice(0, 10);
    info.daysRemaining = Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / 86_400_000);
    const issuer = cert.issuer?.O ?? cert.issuer?.CN;
    if (issuer) info.issuer = Array.isArray(issuer) ? issuer[0] : issuer;
  }
  return info;
}

function requestOnce(url: URL, opts: Required<FetchOptions>): Promise<RawResponse> {
  const lib = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request(
      url,
      {
        method: "GET",
        lookup: safeLookup(opts.allowPrivate),
        timeout: opts.timeoutMs,
        maxHeaderSize: 64 * 1024,
        agent: false,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        },
      },
      (res) => {
        const tls = url.protocol === "https:" ? tlsInfo(res.socket as TLSSocket) : null;
        const headers: HeaderMap = {};
        for (const [k, v] of Object.entries(res.headers)) headers[k.toLowerCase()] = v;
        // We only need headers; don't download the body.
        res.destroy();
        resolve({ status: res.statusCode ?? 0, headers, tls });
      },
    );
    req.on("timeout", () => req.destroy(new Error(`Timed out after ${opts.timeoutMs / 1000}s.`)));
    req.on("error", reject);
    req.end();
  });
}

/** Fetch a URL's response headers, following redirects safely. */
export async function fetchHeaders(input: string, options: FetchOptions = {}): Promise<FetchResult> {
  const opts: Required<FetchOptions> = { allowPrivate: false, timeoutMs: TIMEOUT_MS, ...options };
  const start = Date.now();
  let url = validateTarget(input, opts);
  const requestedProtocol = url.protocol as "http:" | "https:";
  const redirects: Hop[] = [];

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await requestOnce(url, opts);
    const location = res.headers["location"];
    if (res.status >= 300 && res.status < 400 && typeof location === "string") {
      redirects.push({ url: url.toString(), status: res.status });
      // Every hop is re-validated, so a redirect can't point us at an internal host.
      url = validateTarget(new URL(location, url).toString(), opts);
      continue;
    }
    return {
      finalUrl: url.toString(),
      status: res.status,
      headers: res.headers,
      redirects,
      tls: res.tls,
      requestedProtocol,
      durationMs: Date.now() - start,
    };
  }
  throw new TargetError(`Too many redirects (more than ${MAX_REDIRECTS}).`);
}
