import { auditCsp, parseCsp } from "./csp";
import { cookieProblems, parseSetCookie } from "./cookies";
import type { CheckResult, FetchResult, HeaderMap } from "./types";

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

type Check = (r: FetchResult) => CheckResult | null;

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export const checkHttps: Check = (r) => {
  const isHttps = r.finalUrl.startsWith("https:");
  const base = {
    id: "https",
    title: "HTTPS",
    category: "transport" as const,
    weight: 20,
    reference: "https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/TLS",
  };
  if (isHttps) {
    const details =
      r.requestedProtocol === "http:" ? ["Plain HTTP request was redirected to HTTPS."] : [];
    return { ...base, status: "pass", summary: "Site is served over HTTPS.", details };
  }
  return {
    ...base,
    status: "fail",
    summary: "Site is served over plain HTTP.",
    details: ["Traffic can be read and modified by anyone on the network path."],
    recommendation: "Serve the site over HTTPS and redirect all HTTP requests to it (301).",
  };
};

export const checkTls: Check = (r) => {
  if (!r.tls) return null;
  const base = {
    id: "tls",
    title: "TLS & certificate",
    category: "transport" as const,
    weight: 10,
    reference: "https://ssl-config.mozilla.org/",
  };
  const details: string[] = [];
  if (r.tls.protocol) details.push(`Protocol: ${r.tls.protocol}`);
  if (r.tls.issuer) details.push(`Issuer: ${r.tls.issuer}`);
  if (r.tls.validTo) details.push(`Expires: ${r.tls.validTo}`);

  const legacy = r.tls.protocol && /^(SSLv|TLSv1(\.[01])?$)/.test(r.tls.protocol);
  if (legacy) {
    return {
      ...base,
      status: "fail",
      summary: `Negotiated a deprecated protocol (${r.tls.protocol}).`,
      details,
      recommendation: "Disable TLS 1.0/1.1 and enable TLS 1.2 and 1.3.",
    };
  }
  const days = r.tls.daysRemaining;
  if (days !== undefined && days < 0) {
    return { ...base, status: "fail", summary: "Certificate has expired.", details, recommendation: "Renew the certificate." };
  }
  if (days !== undefined && days < 14) {
    return {
      ...base,
      status: "warn",
      summary: `Certificate expires in ${days} day${days === 1 ? "" : "s"}.`,
      details,
      recommendation: "Renew the certificate soon, or automate renewal (e.g. Let's Encrypt + certbot).",
    };
  }
  return { ...base, status: "pass", summary: `Modern TLS${days !== undefined ? `, certificate valid for ${days} more days` : ""}.`, details };
};

export const checkHsts: Check = (r) => {
  const base = {
    id: "hsts",
    title: "Strict-Transport-Security",
    category: "transport" as const,
    weight: 15,
    reference: MDN + "Strict-Transport-Security",
    example: "Strict-Transport-Security: max-age=63072000; includeSubDomains; preload",
  };
  if (!r.finalUrl.startsWith("https:")) {
    return {
      ...base,
      status: "fail",
      summary: "HSTS requires HTTPS.",
      details: ["Browsers ignore HSTS sent over plain HTTP."],
      recommendation: "Enable HTTPS first, then send HSTS.",
    };
  }
  const value = getHeader(r.headers, "strict-transport-security");
  if (!value) {
    return {
      ...base,
      status: "fail",
      summary: "Header is missing.",
      details: ["Without HSTS, a first visit over HTTP can be intercepted (SSL stripping)."],
      recommendation: "Send HSTS with a max-age of at least 6 months (ideally 2 years).",
    };
  }
  const directives = value.toLowerCase().split(";").map((d) => d.trim());
  const maxAgeRaw = directives.find((d) => d.startsWith("max-age"))?.split("=")[1]?.replace(/"/g, "");
  const maxAge = maxAgeRaw !== undefined ? Number.parseInt(maxAgeRaw, 10) : NaN;
  const details: string[] = [];
  const sub = directives.includes("includesubdomains");
  const preload = directives.includes("preload");
  details.push(sub ? "Covers subdomains (includeSubDomains)." : "Does not cover subdomains.");
  if (preload) details.push("Marked for browser preload lists.");

  if (Number.isNaN(maxAge) || maxAge <= 0) {
    return {
      ...base,
      value,
      status: "fail",
      summary: Number.isNaN(maxAge) ? "max-age is missing or invalid." : "max-age=0 disables HSTS.",
      details,
      recommendation: "Set max-age to at least 15552000 (6 months).",
    };
  }
  const days = Math.round(maxAge / 86_400);
  if (maxAge < SIX_MONTHS) {
    return {
      ...base,
      value,
      status: "warn",
      summary: `max-age is short (${days} day${days === 1 ? "" : "s"}).`,
      details,
      recommendation: "Increase max-age to at least 15552000 (6 months).",
    };
  }
  return { ...base, value, status: "pass", summary: `Enabled for ${days} days.`, details };
};

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export const checkCsp: Check = (r) => {
  const base = {
    id: "csp",
    title: "Content-Security-Policy",
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
        summary: "Only a report-only policy is set.",
        details: ["Report-only mode logs violations but does not block anything."],
        recommendation: "Once the reports look clean, switch to the enforcing Content-Security-Policy header.",
      };
    }
    return {
      ...base,
      status: "fail",
      summary: "Header is missing.",
      details: ["CSP is the main browser defense against XSS and data injection."],
      recommendation: "Add a CSP. Start with Content-Security-Policy-Report-Only to find breakage, then enforce.",
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
      summary: `Policy present but weak (${major.length} major issue${major.length > 1 ? "s" : ""}).`,
      details,
      recommendation: "Replace 'unsafe-inline'/'unsafe-eval' and broad sources with nonces or hashes.",
    };
  }
  return {
    ...base,
    value,
    status: "pass",
    summary: issues.length ? "Policy present, with minor suggestions." : "Strong policy.",
    details,
  };
};

export const checkContentTypeOptions: Check = (r) => {
  const value = getHeader(r.headers, "x-content-type-options");
  const base = {
    id: "xcto",
    title: "X-Content-Type-Options",
    category: "content" as const,
    weight: 10,
    reference: MDN + "X-Content-Type-Options",
    example: "X-Content-Type-Options: nosniff",
  };
  if (value?.trim().toLowerCase() === "nosniff") {
    return { ...base, value, status: "pass", summary: "MIME sniffing is disabled.", details: [] };
  }
  return {
    ...base,
    value,
    status: "fail",
    summary: value ? `Invalid value "${value}".` : "Header is missing.",
    details: ["Browsers may interpret uploaded files as scripts or HTML (MIME confusion)."],
    recommendation: "Send X-Content-Type-Options: nosniff on every response.",
  };
};

// ---------------------------------------------------------------------------
// Framing / isolation
// ---------------------------------------------------------------------------

export const checkFraming: Check = (r) => {
  const base = {
    id: "framing",
    title: "Clickjacking protection",
    category: "framing" as const,
    weight: 15,
    reference: MDN + "Content-Security-Policy/frame-ancestors",
    example: "Content-Security-Policy: frame-ancestors 'self'",
  };
  const csp = getHeader(r.headers, "content-security-policy");
  const frameAncestors = csp ? parseCsp(csp).get("frame-ancestors") : undefined;
  if (frameAncestors) {
    return {
      ...base,
      value: `frame-ancestors ${frameAncestors.join(" ")}`,
      status: frameAncestors.includes("*") ? "warn" : "pass",
      summary: frameAncestors.includes("*")
        ? "frame-ancestors allows any site to embed this page."
        : "Controlled via CSP frame-ancestors.",
      details: [],
      recommendation: frameAncestors.includes("*") ? "Restrict frame-ancestors to 'self' or trusted origins." : undefined,
    };
  }
  const xfo = getHeader(r.headers, "x-frame-options");
  const v = xfo?.trim().toUpperCase();
  if (v === "DENY" || v === "SAMEORIGIN") {
    return {
      ...base,
      value: xfo,
      status: "pass",
      summary: `X-Frame-Options: ${v}.`,
      details: ["Consider also adding CSP frame-ancestors, its modern replacement."],
    };
  }
  if (v?.startsWith("ALLOW-FROM")) {
    return {
      ...base,
      value: xfo,
      status: "warn",
      summary: "ALLOW-FROM is obsolete and ignored by modern browsers.",
      details: [],
      recommendation: "Use CSP frame-ancestors with the allowed origin instead.",
    };
  }
  return {
    ...base,
    value: xfo,
    status: "fail",
    summary: xfo ? `Invalid X-Frame-Options value "${xfo}".` : "No frame-ancestors or X-Frame-Options.",
    details: ["Any site can embed this page in an iframe and trick users into clicking (clickjacking)."],
    recommendation: "Add CSP frame-ancestors 'self' (and optionally X-Frame-Options: SAMEORIGIN for old browsers).",
  };
};

export const checkCoop: Check = (r) => {
  const value = getHeader(r.headers, "cross-origin-opener-policy");
  const base = {
    id: "coop",
    title: "Cross-Origin-Opener-Policy",
    category: "framing" as const,
    weight: 5,
    reference: MDN + "Cross-Origin-Opener-Policy",
    example: "Cross-Origin-Opener-Policy: same-origin",
  };
  const v = value?.trim().toLowerCase();
  if (v === "same-origin" || v === "same-origin-allow-popups" || v === "noopener-allow-popups") {
    return { ...base, value, status: "pass", summary: `Browsing context isolated (${v}).`, details: [] };
  }
  return {
    ...base,
    value,
    status: "warn",
    summary: value ? `Weak value "${value}".` : "Header is missing.",
    details: ["Cross-origin windows opened from this page keep a reference to it (XS-Leaks, tabnabbing)."],
    recommendation: "Send Cross-Origin-Opener-Policy: same-origin (or same-origin-allow-popups if you rely on OAuth popups).",
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

export const checkReferrerPolicy: Check = (r) => {
  const value = getHeader(r.headers, "referrer-policy");
  const base = {
    id: "referrer",
    title: "Referrer-Policy",
    category: "privacy" as const,
    weight: 10,
    reference: MDN + "Referrer-Policy",
    example: "Referrer-Policy: strict-origin-when-cross-origin",
  };
  if (!value) {
    return {
      ...base,
      status: "warn",
      summary: "Header is missing.",
      details: ["Modern browsers default to strict-origin-when-cross-origin, but older ones may leak full URLs."],
      recommendation: "Set the policy explicitly.",
    };
  }
  // The last recognized token wins (fallback syntax).
  const tokens = value.toLowerCase().split(",").map((t) => t.trim());
  const effective = [...tokens].reverse().find((t) => GOOD_REFERRER.has(t) || t === "unsafe-url" || t === "no-referrer-when-downgrade");
  if (effective && GOOD_REFERRER.has(effective)) {
    return { ...base, value, status: "pass", summary: `Policy: ${effective}.`, details: [] };
  }
  return {
    ...base,
    value,
    status: "warn",
    summary: effective ? `"${effective}" leaks full URLs to other sites.` : `Unrecognized value "${value}".`,
    details: ["Full URLs can contain tokens, search terms or other private data."],
    recommendation: "Use strict-origin-when-cross-origin or stricter.",
  };
};

export const checkPermissionsPolicy: Check = (r) => {
  const value = getHeader(r.headers, "permissions-policy");
  const legacy = getHeader(r.headers, "feature-policy");
  const base = {
    id: "permissions",
    title: "Permissions-Policy",
    category: "privacy" as const,
    weight: 5,
    reference: MDN + "Permissions-Policy",
    example: "Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()",
  };
  if (value) {
    return { ...base, value, status: "pass", summary: "Browser features are restricted.", details: [] };
  }
  return {
    ...base,
    value: legacy,
    status: "warn",
    summary: legacy ? "Only the deprecated Feature-Policy header is set." : "Header is missing.",
    details: ["Injected or third-party code could request camera, microphone, geolocation, etc."],
    recommendation: "Disable the browser features your site does not use.",
  };
};

// ---------------------------------------------------------------------------
// Cookies
// ---------------------------------------------------------------------------

export const checkCookies: Check = (r) => {
  const cookies = getSetCookies(r.headers).map(parseSetCookie);
  const base = {
    id: "cookies",
    title: "Cookie flags",
    category: "cookies" as const,
    weight: 15,
    reference: MDN + "Set-Cookie",
    example: "Set-Cookie: session=…; Path=/; Secure; HttpOnly; SameSite=Lax",
  };
  if (cookies.length === 0) {
    return { ...base, weight: 0, status: "info", summary: "No cookies set on this response.", details: [] };
  }
  const https = r.finalUrl.startsWith("https:");
  let critical = 0;
  let minor = 0;
  const details: string[] = [];
  for (const c of cookies) {
    const p = cookieProblems(c, https);
    critical += p.critical.length;
    minor += p.minor.length;
    const all = [...p.critical, ...p.minor];
    details.push(all.length ? `${c.name}: ${all.join(", ")}` : `${c.name}: OK`);
  }
  const n = cookies.length;
  const label = `${n} cookie${n > 1 ? "s" : ""}`;
  if (critical > 0) {
    return {
      ...base,
      status: "fail",
      summary: `${label}, some can leak over insecure connections.`,
      details,
      recommendation: "Add Secure to every cookie; add HttpOnly and SameSite to session cookies.",
    };
  }
  if (minor > 0) {
    return {
      ...base,
      status: "warn",
      summary: `${label}, some missing HttpOnly or SameSite.`,
      details,
      recommendation: "Add HttpOnly to cookies JavaScript does not need to read, and set SameSite=Lax or Strict.",
    };
  }
  return { ...base, status: "pass", summary: `${label}, all properly flagged.`, details };
};

// ---------------------------------------------------------------------------
// Information disclosure
// ---------------------------------------------------------------------------

const LEAKY_HEADERS = ["x-powered-by", "x-aspnet-version", "x-aspnetmvc-version", "x-generator", "x-drupal-cache", "x-runtime"];

export const checkDisclosure: Check = (r) => {
  const base = {
    id: "disclosure",
    title: "Information disclosure",
    category: "disclosure" as const,
    weight: 5,
    reference: "https://owasp.org/www-project-secure-headers/#div-headers",
  };
  const details: string[] = [];
  const server = getHeader(r.headers, "server");
  if (server && /\d/.test(server)) details.push(`Server: ${server} (reveals a version number)`);
  for (const h of LEAKY_HEADERS) {
    const v = getHeader(r.headers, h);
    if (v) details.push(`${h}: ${v}`);
  }
  if (details.length === 0) {
    return { ...base, status: "pass", summary: "No technology or version details leaked.", details: [] };
  }
  return {
    ...base,
    status: "warn",
    summary: "Headers reveal the technology stack.",
    details,
    recommendation:
      "Remove or genericize these headers (e.g. server_tokens off in nginx, expose_php = Off in php.ini) so attackers can't match known CVEs.",
  };
};

export const checkLegacyXss: Check = (r) => {
  const value = getHeader(r.headers, "x-xss-protection");
  if (!value) return null;
  const enabled = value.trim().startsWith("1");
  return {
    id: "xxss",
    title: "X-XSS-Protection",
    category: "content",
    weight: 0,
    status: "info",
    value,
    summary: enabled ? "Deprecated XSS auditor is enabled." : "Deprecated header, correctly disabled.",
    details: enabled
      ? ["The XSS auditor was removed from browsers and could itself introduce leaks. Rely on CSP instead."]
      : [],
    recommendation: enabled ? "Set X-XSS-Protection: 0 or remove the header." : undefined,
    reference: MDN + "X-XSS-Protection",
  };
};

export const checkCors: Check = (r) => {
  const origin = getHeader(r.headers, "access-control-allow-origin");
  if (!origin) return null;
  const creds = getHeader(r.headers, "access-control-allow-credentials")?.toLowerCase() === "true";
  const wildcard = origin.trim() === "*";
  return {
    id: "cors",
    title: "CORS",
    category: "content",
    weight: 0,
    status: "info",
    value: origin,
    summary: wildcard ? "Any origin can read this response." : `Readable cross-origin by ${origin}.`,
    details: [
      wildcard
        ? "Fine for public assets and APIs; a problem if the page contains private data."
        : "Make sure this origin is intended, not reflected from the request.",
      ...(creds ? ["Access-Control-Allow-Credentials: true is set."] : []),
    ],
    reference: MDN + "Access-Control-Allow-Origin",
  };
};

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

export function runChecks(r: FetchResult): CheckResult[] {
  return ALL_CHECKS.map((c) => c(r)).filter((c): c is CheckResult => c !== null);
}
