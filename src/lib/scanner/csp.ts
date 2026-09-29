import { msg, type Message } from "@/lib/i18n";

/** Minimal Content-Security-Policy parser (CSP Level 3 syntax). */
export type CspDirectives = Map<string, string[]>;

export function parseCsp(policy: string): CspDirectives {
  const directives: CspDirectives = new Map();
  for (const raw of policy.split(";")) {
    const tokens = raw.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const name = tokens[0].toLowerCase();
    // Per spec, only the first occurrence of a directive is honored.
    if (!directives.has(name)) {
      directives.set(name, tokens.slice(1).map((t) => t.toLowerCase()));
    }
  }
  return directives;
}

/** Sources that effectively govern scripts: script-src, falling back to default-src. */
export function effectiveScriptSources(csp: CspDirectives): string[] | undefined {
  return csp.get("script-src") ?? csp.get("default-src");
}

const NONCE_OR_HASH = /^'(nonce-|sha256-|sha384-|sha512-)/;

export interface CspIssue {
  severity: "major" | "minor";
  message: Message;
}

export function auditCsp(csp: CspDirectives): CspIssue[] {
  const issues: CspIssue[] = [];
  const script = effectiveScriptSources(csp);

  if (!script) {
    issues.push({
      severity: "major",
      message: msg("check.csp.issue.noScriptSrc"),
    });
  } else {
    const hasNonceOrHash = script.some((s) => NONCE_OR_HASH.test(s));
    const strictDynamic = script.includes("'strict-dynamic'");

    // 'unsafe-inline' is ignored by modern browsers when a nonce/hash is present.
    if (script.includes("'unsafe-inline'") && !hasNonceOrHash) {
      issues.push({
        severity: "major",
        message: msg("check.csp.issue.unsafeInline"),
      });
    }
    if (script.includes("'unsafe-eval'")) {
      issues.push({
        severity: "major",
        message: msg("check.csp.issue.unsafeEval"),
      });
    }
    if (!strictDynamic) {
      const broad = script.filter((s) => s === "*" || s === "http:" || s === "https:" || s === "data:");
      if (broad.length > 0) {
        issues.push({
          severity: "major",
          message: msg("check.csp.issue.broad", { sources: broad.join(" ") }),
        });
      }
    }
  }

  const defaultNone = csp.get("default-src")?.includes("'none'") ?? false;
  if (!csp.has("object-src") && !defaultNone) {
    issues.push({
      severity: "minor",
      message: msg("check.csp.issue.noObjectSrc"),
    });
  }
  if (!csp.has("base-uri")) {
    issues.push({
      severity: "minor",
      message: msg("check.csp.issue.noBaseUri"),
    });
  }
  return issues;
}
