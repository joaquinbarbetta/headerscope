import { rateLimit } from "@/lib/rate-limit";
import { TargetError, scan } from "@/lib/scanner";

export const maxDuration = 30;

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

function friendlyError(err: unknown): string {
  if (err instanceof TargetError) return err.message;
  const e = err as NodeJS.ErrnoException;
  switch (e?.code) {
    case "ENOTFOUND":
    case "EAI_AGAIN":
      return "Domain not found. Check the spelling.";
    case "ECONNREFUSED":
      return "The server refused the connection.";
    case "ECONNRESET":
      return "The server closed the connection.";
    case "CERT_HAS_EXPIRED":
      return "The site's TLS certificate has expired.";
    case "DEPTH_ZERO_SELF_SIGNED_CERT":
    case "SELF_SIGNED_CERT_IN_CHAIN":
      return "The site uses a self-signed TLS certificate.";
    case "ERR_TLS_CERT_ALTNAME_INVALID":
      return "The TLS certificate doesn't match this domain.";
    case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
      return "The TLS certificate chain is incomplete.";
  }
  if (e?.message?.startsWith("Timed out")) return e.message;
  return "Could not reach the site.";
}

export async function POST(request: Request) {
  const limit = rateLimit(clientIp(request));
  if (!limit.ok) {
    return Response.json(
      { error: `Too many scans. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let url: unknown;
  try {
    ({ url } = await request.json());
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (typeof url !== "string") {
    return Response.json({ error: "Body must be { \"url\": string }." }, { status: 400 });
  }

  try {
    const report = await scan(url);
    return Response.json(report);
  } catch (err) {
    const status = err instanceof TargetError ? 400 : 502;
    return Response.json({ error: friendlyError(err) }, { status });
  }
}
