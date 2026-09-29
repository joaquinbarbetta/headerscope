/**
 * SSRF protection. The scanner fetches arbitrary user-supplied URLs from our
 * server, so without these checks anyone could use it to probe internal
 * networks or cloud metadata endpoints (e.g. http://169.254.169.254/).
 *
 * Two layers:
 *  1. validateTarget(): syntactic checks on the URL before any request.
 *  2. isPublicAddress(): applied to every resolved IP *at connect time*
 *     (see fetcher.ts), which also defeats DNS-rebinding tricks.
 */
import { BlockList, isIP } from "node:net";

export class TargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TargetError";
  }
}

export const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

const blocked = new BlockList();
// IPv4 special-purpose ranges (RFC 6890 and friends)
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blocked.addSubnet(net, prefix, "ipv4");
}
// IPv6 special-purpose ranges
for (const [net, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["100::", 64],
  ["2001:db8::", 32],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blocked.addSubnet(net, prefix, "ipv6");
}

/** Extract an embedded IPv4 from IPv4-mapped (::ffff:a.b.c.d) or NAT64 (64:ff9b::a.b.c.d) addresses. */
function embeddedIpv4(ip: string): string | null {
  const lower = ip.toLowerCase();
  const m = lower.match(/^(?:::ffff:|64:ff9b::)(?:0:)?(\d+\.\d+\.\d+\.\d+)$/);
  if (m) return m[1];
  const hex = lower.match(/^(?:::ffff:|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const a = parseInt(hex[1], 16);
    const b = parseInt(hex[2], 16);
    return `${a >> 8}.${a & 255}.${b >> 8}.${b & 255}`;
  }
  return null;
}

export function isPublicAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return !blocked.check(ip, "ipv4");
  if (family === 6) {
    const v4 = embeddedIpv4(ip);
    if (v4) return isPublicAddress(v4);
    return !blocked.check(ip, "ipv6");
  }
  return false;
}

/** Normalize user input into a URL we are willing to fetch. Throws TargetError otherwise. */
export function validateTarget(input: string, opts: { allowPrivate?: boolean } = {}): URL {
  const trimmed = input.trim();
  if (!trimmed) throw new TargetError("Please enter a URL.");
  if (trimmed.length > 2048) throw new TargetError("URL is too long.");

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new TargetError("That doesn't look like a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TargetError("Only http:// and https:// URLs can be scanned.");
  }
  if (url.username || url.password) {
    throw new TargetError("URLs with embedded credentials are not allowed.");
  }
  if (opts.allowPrivate) return url;

  if (!ALLOWED_PORTS.has(url.port)) {
    throw new TargetError("Only ports 80, 443, 8080 and 8443 are allowed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new TargetError("Local and internal hostnames can't be scanned.");
  }
  if (isIP(host)) {
    if (!isPublicAddress(host)) throw new TargetError("Private or reserved IP addresses can't be scanned.");
  } else if (!host.includes(".")) {
    throw new TargetError("Please enter a full domain name (e.g. example.com).");
  }
  return url;
}
