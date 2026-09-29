export type Status = "pass" | "warn" | "fail" | "info";

export type Category = "transport" | "content" | "framing" | "privacy" | "cookies" | "disclosure";

export interface CheckResult {
  /** Stable identifier, e.g. "hsts". */
  id: string;
  /** Human-readable name, e.g. "Strict-Transport-Security". */
  title: string;
  category: Category;
  status: Status;
  /** Short one-line verdict. */
  summary: string;
  /** Extra findings (one line each). */
  details: string[];
  /** What to do about it. Empty when the check passes. */
  recommendation?: string;
  /** Example header / config value that fixes the issue. */
  example?: string;
  /** Raw value observed, if any. */
  value?: string;
  /** Relative importance used for scoring. Info checks are not scored. */
  weight: number;
  /** Link to reference documentation. */
  reference: string;
}

/** Lower-cased header name → value. `set-cookie` is always an array. */
export type HeaderMap = Record<string, string | string[] | undefined>;

export interface TlsInfo {
  protocol: string | null;
  issuer?: string;
  validTo?: string;
  daysRemaining?: number;
}

export interface Hop {
  url: string;
  status: number;
}

export interface FetchResult {
  finalUrl: string;
  status: number;
  headers: HeaderMap;
  redirects: Hop[];
  tls: TlsInfo | null;
  /** Protocol of the URL the user asked for. */
  requestedProtocol: "http:" | "https:";
  durationMs: number;
}

export interface ScanReport {
  url: string;
  finalUrl: string;
  status: number;
  scannedAt: string;
  durationMs: number;
  score: number;
  grade: string;
  counts: Record<Status, number>;
  checks: CheckResult[];
  headers: Record<string, string>;
  redirects: Hop[];
  tls: TlsInfo | null;
}
