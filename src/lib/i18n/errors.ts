import { TargetError } from "@/lib/scanner/ssrf";
import { msg, type Message } from ".";

/**
 * The scanner core (ssrf.ts / fetcher.ts) throws English messages; this maps
 * them to translatable messages without touching the security code.
 * tests/i18n.test.ts verifies every TargetError message thrown there is covered.
 */
const TARGET_ERRORS: Record<string, Message> = {
  "Please enter a URL.": msg("error.emptyUrl"),
  "URL is too long.": msg("error.urlTooLong"),
  "That doesn't look like a valid URL.": msg("error.invalidUrl"),
  "Only http:// and https:// URLs can be scanned.": msg("error.protocol"),
  "URLs with embedded credentials are not allowed.": msg("error.credentials"),
  "Only ports 80, 443, 8080 and 8443 are allowed.": msg("error.port"),
  "Local and internal hostnames can't be scanned.": msg("error.internalHost"),
  "Private or reserved IP addresses can't be scanned.": msg("error.privateIp"),
  "Please enter a full domain name (e.g. example.com).": msg("error.fullDomain"),
  "This host resolves to a private or reserved IP address.": msg("error.resolvesPrivate"),
};

const NODE_ERRORS: Record<string, Message> = {
  ENOTFOUND: msg("error.notFound"),
  EAI_AGAIN: msg("error.notFound"),
  ECONNREFUSED: msg("error.refused"),
  ECONNRESET: msg("error.reset"),
  CERT_HAS_EXPIRED: msg("error.certExpired"),
  DEPTH_ZERO_SELF_SIGNED_CERT: msg("error.selfSigned"),
  SELF_SIGNED_CERT_IN_CHAIN: msg("error.selfSigned"),
  ERR_TLS_CERT_ALTNAME_INVALID: msg("error.altName"),
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: msg("error.incompleteChain"),
};

/** Turn a scan failure into a user-facing, translatable message. */
export function scanErrorMessage(err: unknown): Message {
  const e = err as NodeJS.ErrnoException | undefined;
  const text = e?.message ?? "";

  const redirects = /^Too many redirects \(more than (\d+)\)/.exec(text);
  if (redirects) return msg("error.tooManyRedirects", { max: Number(redirects[1]) });
  const timeout = /^Timed out after ([\d.]+)s/.exec(text);
  if (timeout) return msg("error.timeout", { seconds: Number(timeout[1]) });

  if (err instanceof TargetError) return TARGET_ERRORS[text] ?? msg("error.invalidUrl");
  if (e?.code && NODE_ERRORS[e.code]) return NODE_ERRORS[e.code];
  return msg("error.unreachable");
}

export { TARGET_ERRORS };
