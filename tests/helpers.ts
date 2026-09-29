import type { FetchResult, HeaderMap } from "@/lib/scanner/types";

export function fakeResult(headers: HeaderMap, overrides: Partial<FetchResult> = {}): FetchResult {
  const lower: HeaderMap = {};
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v;
  return {
    finalUrl: "https://example.com/",
    status: 200,
    headers: lower,
    redirects: [],
    tls: { protocol: "TLSv1.3", daysRemaining: 60 },
    requestedProtocol: "https:",
    durationMs: 10,
    ...overrides,
  };
}

/** Headers of a well-configured site. */
export const HARDENED: HeaderMap = {
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "content-security-policy":
    "default-src 'self'; script-src 'self' 'nonce-abc123' 'strict-dynamic'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=()",
  "cross-origin-opener-policy": "same-origin",
  "set-cookie": ["session=abc; Path=/; Secure; HttpOnly; SameSite=Lax"],
  server: "nginx",
};
