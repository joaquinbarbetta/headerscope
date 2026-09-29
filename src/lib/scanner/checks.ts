import { DEFAULT_LOCALE, msg, translate, type Locale, type Message } from "@/lib/i18n";
import { auditCsp, parseCsp } from "./csp";
import { cookieProblems, parseSetCookie } from "./cookies";
import type { CheckResult, FetchResult, HeaderMap, RawCheckResult } from "./types";

const MDN = "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/";
const SIX_MONTHS = 15_552_000;

export function getHeader(h: HeaderMap, name: string): string | undefined {
  const v = h[name.toLowerCase()];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v.join(", ") : v;
}

function getSetCookies(h: HeaderMap): string[] {
  const v = h["set-cookie"];
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

type RawCheck = (r: FetchResult) => RawCheckResult | null;
export type Check = (r: FetchResult, locale?: Locale) => CheckResult | null;

/** Render a check's messages into strings for `locale`, keeping the messages alongside. */
export function localizeCheck(raw: RawCheckResult, locale: Locale): CheckResult {
  const { title, summary, details, recommendation, ...rest } = raw;
  const t = (m: Message) => translate(locale, m);
  return {
    ...rest,
    title: t(title),
    summary: t(summary),
    details: details.map(t),
    recommendation: recommendation && t(recommendation),
    messages: { title, summary, details, recommendation },
  };
}

function localized(check: RawCheck): Check {
  return (r, locale = DEFAULT_LOCALE) => {
    const raw = check(r);
    return raw && localizeCheck(raw, locale);
  };
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

const https: RawCheck = (r) => {
  const isHttps = r.finalUrl.startsWith("https:");
  const base = {
    id: "https",
    title: msg("check.https.title"),
    category: "transport" as const,
    weight: 20,
    reference: "https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/TLS",
  };
  if (isHttps) {
    const details = r.requestedProtocol === "http:" ? [msg("check.https.upgraded")] : [];
    return { ...base, status: "pass", summary: msg("check.https.pass"), details };
  }
  return {
    ...base,
    status: "fail",
    summary: msg("check.https.fail"),
    details: [msg("check.https.failDetail")],
    recommendation: msg("check.https.failRec"),
  };
};

const tls: RawCheck = (r) => {
  if (!r.tls) return null;
  const base = {
    id: "tls",
    title: msg("check.tls.title"),
    category: "transport" as const,
    weight: 10,
    reference: "https://ssl-config.mozilla.org/",
  };
  const details: Message[] = [];
  if (r.tls.protocol) details.push(msg("check.tls.protocol", { protocol: r.tls.protocol }));
  if (r.tls.issuer) details.push(msg("check.tls.issuer", { issuer: r.tls.issuer }));
  if (r.tls.validTo) details.push(msg("check.tls.expires", { date: r.tls.validTo }));

  const legacy = r.tls.protocol && /^(SSLv|TLSv1(\.[01])?$)/.test(r.tls.protocol);
  if (legacy) {
    return {
      ...base,
      status: "fail",
      summary: msg("check.tls.legacy", { protocol: r.tls.protocol! }),
      details,
      recommendation: msg("check.tls.legacyRec"),
    };
  }
  const days = r.tls.daysRemaining;
  if (days !== undefined && days < 0) {
    return {
      ...base,
      status: "fail",
      summary: msg("check.tls.expired"),
      details,
      recommendation: msg("check.tls.expiredRec"),
    };
  }
  if (days !== undefined && days < 14) {
    return {
      ...base,
      status: "warn",
      summary: msg("check.tls.expiring", { days }),
      details,
      recommendation: msg("check.tls.expiringRec"),
    };
  }
  return {
    ...base,
    status: "pass",
    summary: days !== undefined ? msg("check.tls.passDays", { days }) : msg("check.tls.pass"),
    details,
  };
};

const hsts: RawCheck = (r) => {
  const base = {
    id: "hsts",
    title: msg("check.hsts.title"),
    category: "transport" as const,
    weight: 15,
    reference: MDN + "Strict-Transport-Security",
    example: "Strict-Transport-Security: max-age=63072000; includeSubDomains; preload",
  };
  if (!r.finalUrl.startsWith("https:")) {
    return {
      ...base,
      status: "fail",
      summary: msg("check.hsts.requiresHttps"),
      details: [msg("check.hsts.requiresHttpsDetail")],
      recommendation: msg("check.hsts.requiresHttpsRec"),
    };
  }
  const value = getHeader(r.headers, "strict-transport-security");
  if (!value) {
    return {
      ...base,
      status: "fail",
      summary: msg("check.missing"),
      details: [msg("check.hsts.missingDetail")],
      recommendation: msg("check.hsts.missingRec"),
    };
  }
  const directives = value.toLowerCase().split(";").map((d) => d.trim());
  const maxAgeRaw = directives.find((d) => d.startsWith("max-age"))?.split("=")[1]?.replace(/"/g, "");
  const maxAge = maxAgeRaw !== undefined ? Number.parseInt(maxAgeRaw, 10) : NaN;
  const details: Message[] = [];
  const sub = directives.includes("includesubdomains");
  const preload = directives.includes("preload");
  details.push(sub ? msg("check.hsts.subdomains") : msg("check.hsts.noSubdomains"));
  if (preload) details.push(msg("check.hsts.preload"));

  if (Number.isNaN(maxAge) || maxAge <= 0) {
    return {
      ...base,
      value,
      status: "fail",
      summary: Number.isNaN(maxAge) ? msg("check.hsts.maxAgeInvalid") : msg("check.hsts.maxAgeZero"),
      details,
      recommendation: msg("check.hsts.maxAgeRec"),
    };
  }
  const days = Math.round(maxAge / 86_400);
  if (maxAge < SIX_MONTHS) {
    return {
      ...base,
      value,
      status: "warn",
      summary: msg("check.hsts.short", { days }),
      details,
      recommendation: msg("check.hsts.shortRec"),
    };
  }
  return { ...base, value, status: "pass", summary: msg("check.hsts.pass", { days }), details };
};

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const csp: RawCheck = (r) => {
  const base = {
    id: "csp",
    title: msg("check.csp.title"),
    category: "content" as const,
    weight: 25,
    reference: MDN + "Content-Security-Policy",
    example:
      "Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'",
  };
  const value = getHeader(r.headers, "content-security-policy");
  const reportOnly = getHeader(r.headers, "content-security-policy-report-only");

  if (!value) {
    if (reportOnly) {
      return {
        ...base,
        value: reportOnly,
        status: "warn",
        summary: msg("check.csp.reportOnly"),
        details: [msg("check.csp.reportOnlyDetail")],
        recommendation: msg("check.csp.reportOnlyRec"),
      };
    }
    return {
      ...base,
      status: "fail",
      summary: msg("check.missing"),
      details: [msg("check.csp.missingDetail")],
      recommendation: msg("check.csp.missingRec"),
    };
  }

  const issues = auditCsp(parseCsp(value));
  const major = issues.filter((i) => i.severity === "major");
  const details = issues.map((i) => i.message);
  if (major.length > 0) {
    return {
      ...base,
      value,
      status: "warn",
      summary: msg("check.csp.weak", { count: major.length }),
      details,
      recommendation: msg("check.csp.weakRec"),
    };
  }
  return {
    ...base,
    value,
    status: "pass",
    summary: issues.length ? msg("check.csp.minor") : msg("check.csp.strong"),
    details,
  };
};

const contentTypeOptions: RawCheck = (r) => {
  const value = getHeader(r.headers, "x-content-type-options");
  const base = {
    id: "xcto",
    title: msg("check.xcto.title"),
    category: "content" as const,
    weight: 10,
    reference: MDN + "X-Content-Type-Options",
    example: "X-Content-Type-Options: nosniff",
  };
  if (value?.trim().toLowerCase() === "nosniff") {
    return { ...base, value, status: "pass", summary: msg("check.xcto.pass"), details: [] };
  }
  return {
    ...base,
    value,
    status: "fail",
    summary: value ? msg("check.xcto.invalid", { value }) : msg("check.missing"),
    details: [msg("check.xcto.detail")],
    recommendation: msg("check.xcto.rec"),
  };
};

// ---------------------------------------------------------------------------
// Framing / isolation
// ---------------------------------------------------------------------------

const framing: RawCheck = (r) => {
  const base = {
    id: "framing",
    title: msg("check.framing.title"),
    category: "framing" as const,
    weight: 15,
    reference: MDN + "Content-Security-Policy/frame-ancestors",
    example: "Content-Security-Policy: frame-ancestors 'self'",
  };
  const cspValue = getHeader(r.headers, "content-security-policy");
  const frameAncestors = cspValue ? parseCsp(cspValue).get("frame-ancestors") : undefined;
  if (frameAncestors) {
    const wildcard = frameAncestors.includes("*");
    return {
      ...base,
      value: `frame-ancestors ${frameAncestors.join(" ")}`,
      status: wildcard ? "warn" : "pass",
      summary: wildcard ? msg("check.framing.wildcard") : msg("check.framing.viaCsp"),
      details: [],
      recommendation: wildcard ? msg("check.framing.wildcardRec") : undefined,
    };
  }
  const xfo = getHeader(r.headers, "x-frame-options");
  const v = xfo?.trim().toUpperCase();
  if (v === "DENY" || v === "SAMEORIGIN") {
    return {
      ...base,
      value: xfo,
      status: "pass",
      summary: msg("check.framing.xfo", { value: v }),
      details: [msg("check.framing.xfoDetail")],
    };
  }
  if (v?.startsWith("ALLOW-FROM")) {
    return {
      ...base,
      value: xfo,
      status: "warn",
      summary: msg("check.framing.allowFrom"),
      details: [],
      recommendation: msg("check.framing.allowFromRec"),
    };
  }
  return {
    ...base,
    value: xfo,
    status: "fail",
    summary: xfo ? msg("check.framing.invalid", { value: xfo }) : msg("check.framing.none"),
    details: [msg("check.framing.detail")],
    recommendation: msg("check.framing.rec"),
  };
};

const coop: RawCheck = (r) => {
  const value = getHeader(r.headers, "cross-origin-opener-policy");
  const base = {
    id: "coop",
    title: msg("check.coop.title"),
    category: "framing" as const,
    weight: 5,
    reference: MDN + "Cross-Origin-Opener-Policy",
    example: "Cross-Origin-Opener-Policy: same-origin",
  };
  const v = value?.trim().toLowerCase();
  if (v === "same-origin" || v === "same-origin-allow-popups" || v === "noopener-allow-popups") {
    return { ...base, value, status: "pass", summary: msg("check.coop.pass", { value: v }), details: [] };
  }
  return {
    ...base,
    value,
    status: "warn",
    summary: value ? msg("check.coop.weak", { value }) : msg("check.missing"),
    details: [msg("check.coop.detail")],
    recommendation: msg("check.coop.rec"),
  };
};

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------

const GOOD_REFERRER = new Set([
  "no-referrer",
  "same-origin",
  "strict-origin",
  "strict-origin-when-cross-origin",
  "origin",
  "origin-when-cross-origin",
]);

const referrerPolicy: RawCheck = (r) => {
  const value = getHeader(r.headers, "referrer-policy");
  const base = {
    id: "referrer",
    title: msg("check.referrer.title"),
    category: "privacy" as const,
    weight: 10,
    reference: MDN + "Referrer-Policy",
    example: "Referrer-Policy: strict-origin-when-cross-origin",
  };
  if (!value) {
    return {
      ...base,
      status: "warn",
      summary: msg("check.missing"),
      details: [msg("check.referrer.missingDetail")],
      recommendation: msg("check.referrer.missingRec"),
    };
  }
  // The last recognized token wins (fallback syntax).
  const tokens = value.toLowerCase().split(",").map((t) => t.trim());
  const effective = [...tokens].reverse().find((t) => GOOD_REFERRER.has(t) || t === "unsafe-url" || t === "no-referrer-when-downgrade");
  if (effective && GOOD_REFERRER.has(effective)) {
    return { ...base, value, status: "pass", summary: msg("check.referrer.pass", { policy: effective }), details: [] };
  }
  return {
    ...base,
    value,
    status: "warn",
    summary: effective
      ? msg("check.referrer.leaky", { policy: effective })
      : msg("check.referrer.unrecognized", { value }),
    details: [msg("check.referrer.detail")],
    recommendation: msg("check.referrer.rec"),
  };
};

const permissionsPolicy: RawCheck = (r) => {
  const value = getHeader(r.headers, "permissions-policy");
  const legacy = getHeader(r.headers, "feature-policy");
  const base = {
    id: "permissions",
    title: msg("check.permissions.title"),
    category: "privacy" as const,
    weight: 5,
    reference: MDN + "Permissions-Policy",
    example: "Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()",
  };
  if (value) {
    return { ...base, value, status: "pass", summary: msg("check.permissions.pass"), details: [] };
  }
  return {
    ...base,
    value: legacy,
    status: "warn",
    summary: legacy ? msg("check.permissions.legacyOnly") : msg("check.missing"),
    details: [msg("check.permissions.detail")],
    recommendation: msg("check.permissions.rec"),
  };
};

// ---------------------------------------------------------------------------
// Cookies
// ---------------------------------------------------------------------------

const cookies: RawCheck = (r) => {
  const parsed = getSetCookies(r.headers).map(parseSetCookie);
  const base = {
    id: "cookies",
    title: msg("check.cookies.title"),
    category: "cookies" as const,
    weight: 15,
    reference: MDN + "Set-Cookie",
    example: "Set-Cookie: session=…; Path=/; Secure; HttpOnly; SameSite=Lax",
  };
  if (parsed.length === 0) {
    return { ...base, weight: 0, status: "info", summary: msg("check.cookies.none"), details: [] };
  }
  const isHttps = r.finalUrl.startsWith("https:");
  let critical = 0;
  let minor = 0;
  const details: Message[] = [];
  for (const c of parsed) {
    const p = cookieProblems(c, isHttps);
    critical += p.critical.length;
    minor += p.minor.length;
    const all = [...p.critical, ...p.minor];
    details.push(
      all.length ? msg("check.cookies.cookie", { name: c.name, problems: all }) : msg("check.cookies.ok", { name: c.name }),
    );
  }
  const count = parsed.length;
  if (critical > 0) {
    return {
      ...base,
      status: "fail",
      summary: msg("check.cookies.fail", { count }),
      details,
      recommendation: msg("check.cookies.failRec"),
    };
  }
  if (minor > 0) {
    return {
      ...base,
      status: "warn",
      summary: msg("check.cookies.warn", { count }),
      details,
      recommendation: msg("check.cookies.warnRec"),
    };
  }
  return { ...base, status: "pass", summary: msg("check.cookies.pass", { count }), details };
};

// ---------------------------------------------------------------------------
// Information disclosure
// ---------------------------------------------------------------------------

const LEAKY_HEADERS = ["x-powered-by", "x-aspnet-version", "x-aspnetmvc-version", "x-generator", "x-drupal-cache", "x-runtime"];

const disclosure: RawCheck = (r) => {
  const base = {
    id: "disclosure",
    title: msg("check.disclosure.title"),
    category: "disclosure" as const,
    weight: 5,
    reference: "https://owasp.org/www-project-secure-headers/#div-headers",
  };
  const details: Message[] = [];
  const server = getHeader(r.headers, "server");
  if (server && /\d/.test(server)) details.push(msg("check.disclosure.server", { value: server }));
  for (const h of LEAKY_HEADERS) {
    const v = getHeader(r.headers, h);
    if (v) details.push(msg("check.disclosure.header", { name: h, value: v }));
  }
  if (details.length === 0) {
    return { ...base, status: "pass", summary: msg("check.disclosure.pass"), details: [] };
  }
  return {
    ...base,
    status: "warn",
    summary: msg("check.disclosure.warn"),
    details,
    recommendation: msg("check.disclosure.rec"),
  };
};

const legacyXss: RawCheck = (r) => {
  const value = getHeader(r.headers, "x-xss-protection");
  if (!value) return null;
  const enabled = value.trim().startsWith("1");
  return {
    id: "xxss",
    title: msg("check.xxss.title"),
    category: "content",
    weight: 0,
    status: "info",
    value,
    summary: enabled ? msg("check.xxss.enabled") : msg("check.xxss.disabled"),
    details: enabled ? [msg("check.xxss.enabledDetail")] : [],
    recommendation: enabled ? msg("check.xxss.rec") : undefined,
    reference: MDN + "X-XSS-Protection",
  };
};

const cors: RawCheck = (r) => {
  const origin = getHeader(r.headers, "access-control-allow-origin");
  if (!origin) return null;
  const creds = getHeader(r.headers, "access-control-allow-credentials")?.toLowerCase() === "true";
  const wildcard = origin.trim() === "*";
  return {
    id: "cors",
    title: msg("check.cors.title"),
    category: "content",
    weight: 0,
    status: "info",
    value: origin,
    summary: wildcard ? msg("check.cors.wildcard") : msg("check.cors.origin", { origin }),
    details: [
      wildcard ? msg("check.cors.wildcardDetail") : msg("check.cors.originDetail"),
      ...(creds ? [msg("check.cors.credentials")] : []),
    ],
    reference: MDN + "Access-Control-Allow-Origin",
  };
};

export const checkHttps = localized(https);
export const checkTls = localized(tls);
export const checkHsts = localized(hsts);
export const checkCsp = localized(csp);
export const checkFraming = localized(framing);
export const checkContentTypeOptions = localized(contentTypeOptions);
export const checkReferrerPolicy = localized(referrerPolicy);
export const checkPermissionsPolicy = localized(permissionsPolicy);
export const checkCoop = localized(coop);
export const checkCookies = localized(cookies);
export const checkDisclosure = localized(disclosure);
export const checkLegacyXss = localized(legacyXss);
export const checkCors = localized(cors);

export const ALL_CHECKS: Check[] = [
  checkHttps,
  checkTls,
  checkHsts,
  checkCsp,
  checkFraming,
  checkContentTypeOptions,
  checkReferrerPolicy,
  checkPermissionsPolicy,
  checkCoop,
  checkCookies,
  checkDisclosure,
  checkLegacyXss,
  checkCors,
];

export function runChecks(r: FetchResult, locale: Locale = DEFAULT_LOCALE): CheckResult[] {
  return ALL_CHECKS.map((c) => c(r, locale)).filter((c): c is CheckResult => c !== null);
}
