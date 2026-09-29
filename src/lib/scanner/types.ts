import type { Locale, Message } from "@/lib/i18n";

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
  /** Language-neutral form of the texts above, so clients can re-render them in any locale. */
  messages: CheckMessages;
}

export interface CheckMessages {
  title: Message;
  summary: Message;
  details: Message[];
  recommendation?: Message;
}

/** What a check produces before localization: messages instead of strings. */
export type RawCheckResult = Omit<CheckResult, "title" | "summary" | "details" | "recommendation" | "messages"> &
  CheckMessages;

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
  /** Locale of the human-readable strings in `checks`. */
  lang: Locale;
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
