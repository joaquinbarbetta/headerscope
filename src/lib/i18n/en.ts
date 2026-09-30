/**
 * English dictionary — the source of truth for message keys.
 * Plain strings for fixed text, functions for text with parameters.
 * Header names, directives and code examples are never translated.
 */
const s = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const en = {
  // -------------------------------------------------------------------------
  // Metadata & chrome
  // -------------------------------------------------------------------------
  "meta.title": "HeaderScope — HTTP security headers scanner",
  "meta.description":
    "Scan any website's HTTP response headers, get a security grade and concrete fixes for CSP, HSTS, cookies, clickjacking and more.",
  "nav.skip": "Skip to content",
  "nav.source": "Source",
  "nav.sourceLabel": "HeaderScope source code on GitHub (opens in a new tab)",
  "nav.language": "Language",
  "footer.ethics":
    "Only scan sites you own or have permission to test. HeaderScope sends a single GET request and reads the response headers.",
  "footer.practice": "This page ships a nonce-based strict CSP, HSTS and friends. Scan it.",

  // -------------------------------------------------------------------------
  // Hero & form
  // -------------------------------------------------------------------------
  "hero.eyebrow": "HTTP security headers scanner",
  "hero.titleBefore": "How secure are your",
  "hero.titleAccent": "HTTP headers",
  "hero.titleAfter": "?",
  "hero.subtitle":
    "Audit CSP, HSTS, clickjacking protection, cookie flags and more. Get a grade and copy-pasteable fixes in seconds.",
  "form.label": "Website URL",
  "form.placeholder": "example.com",
  "form.submit": "Scan",
  "form.scanning": "Scanning…",
  "form.try": "Try",
  "form.hint": "Single GET request · headers only · SSRF-hardened",

  // -------------------------------------------------------------------------
  // Loading & empty states
  // -------------------------------------------------------------------------
  "loading.title": (p: { host: string }) => `Scanning ${p.host}`,
  "loading.step.validate": "Validating target URL",
  "loading.step.dns": "Resolving DNS and checking the IP is public",
  "loading.step.tls": "Negotiating TLS",
  "loading.step.request": "Sending GET request",
  "loading.step.redirects": "Following redirects",
  "loading.step.audit": "Auditing response headers",
  "empty.title": "What gets checked",
  "empty.subtitle": "13 checks, weighted by impact. Informational checks don't affect the grade.",
  "empty.weight": (p: { weight: number }) => `${p.weight} pts`,
  "empty.info": "info",
  "empty.eyebrow": "Check catalog",
  "empty.carouselLabel": "Available checks, scrollable horizontally",
  "empty.prev": "Show previous checks",
  "empty.next": "Show next checks",
  "feature.request.title": "One request, zero noise",
  "feature.request.body": "A single GET that reads headers only. No crawling, no page body, no cookies kept.",
  "feature.ssrf.title": "Hardened by design",
  "feature.ssrf.body": "Every redirect hop is re-validated against private and reserved IPs, so the scanner can't be turned inward.",
  "feature.fix.title": "Fixes you can paste",
  "feature.fix.body": "Each finding explains the risk and comes with a ready-to-use header example.",
  "preview.label": "Sample report",
  "preview.host": "your-site.dev",

  // -------------------------------------------------------------------------
  // Categories (report tabs)
  // -------------------------------------------------------------------------
  "category.all": "All",
  "category.transport": "Transport",
  "category.content": "Content",
  "category.cookies": "Cookies",
  "category.privacy": "Privacy",

  // -------------------------------------------------------------------------
  // Report
  // -------------------------------------------------------------------------
  "status.pass": "Pass",
  "status.warn": "Warning",
  "status.fail": "Fail",
  "status.info": "Info",
  "report.heading": "Scan report",
  "report.scoreAria": (p: { grade: string; score: number }) => `Grade ${p.grade}, score ${p.score} out of 100`,
  "report.verdict.A+": "Excellent. Hardened like it should be.",
  "report.verdict.A": "Strong. A couple of details left.",
  "report.verdict.B": "Decent, with room to improve.",
  "report.verdict.C": "Several important headers missing.",
  "report.verdict.D": "Weak. Easy wins available.",
  "report.verdict.F": "Wide open. Start with HTTPS, HSTS and CSP.",
  "report.meta.status": "Status",
  "report.meta.redirects": "Redirects",
  "report.meta.tls": "TLS",
  "report.meta.time": "Time",
  "report.meta.none": "none",
  "report.redirectChain": "Redirect chain",
  "report.filterLabel": "Filter checks by status",
  "report.filterAll": "All",
  "report.downloadJson": "Download JSON",
  "report.rawHeaders": (p: { count: number }) => `Raw response headers (${p.count})`,
  "report.noChecks": "No checks with this status.",
  "report.tabsLabel": "Check categories",
  "report.breakdown": "Score by category",
  "report.categoryScore": (p: { category: string; score: number }) => `${p.category}: ${p.score} out of 100`,
  "report.findings": "Findings",
  "report.scanned": (p: { date: string }) => `Scanned ${p.date}`,
  "card.observed": "Observed value",
  "card.howToFix": "How to fix",
  "card.example": "Example",
  "card.copy": "Copy",
  "card.copied": "Copied",
  "card.copyLabel": "Copy example to clipboard",
  "card.learnMore": "Learn more",
  "card.newTab": "(opens in a new tab)",

  // -------------------------------------------------------------------------
  // Errors
  // -------------------------------------------------------------------------
  "error.generic": "Something went wrong.",
  "error.network": "Network error. Is the server running?",
  "error.rateLimited": (p: { seconds: number }) => `Too many scans. Try again in ${p.seconds}s.`,
  "error.invalidJson": "Invalid JSON body.",
  "error.invalidBody": 'Body must be { "url": string, "lang"?: "en" | "es" }.',
  "error.emptyUrl": "Please enter a URL.",
  "error.urlTooLong": "URL is too long.",
  "error.invalidUrl": "That doesn't look like a valid URL.",
  "error.protocol": "Only http:// and https:// URLs can be scanned.",
  "error.credentials": "URLs with embedded credentials are not allowed.",
  "error.port": "Only ports 80, 443, 8080 and 8443 are allowed.",
  "error.internalHost": "Local and internal hostnames can't be scanned.",
  "error.privateIp": "Private or reserved IP addresses can't be scanned.",
  "error.fullDomain": "Please enter a full domain name (e.g. example.com).",
  "error.resolvesPrivate": "This host resolves to a private or reserved IP address.",
  "error.tooManyRedirects": (p: { max: number }) => `Too many redirects (more than ${p.max}).`,
  "error.timeout": (p: { seconds: number }) => `Timed out after ${p.seconds}s.`,
  "error.notFound": "Domain not found. Check the spelling.",
  "error.refused": "The server refused the connection.",
  "error.reset": "The server closed the connection.",
  "error.certExpired": "The site's TLS certificate has expired.",
  "error.selfSigned": "The site uses a self-signed TLS certificate.",
  "error.altName": "The TLS certificate doesn't match this domain.",
  "error.incompleteChain": "The TLS certificate chain is incomplete.",
  "error.unreachable": "Could not reach the site.",

  // -------------------------------------------------------------------------
  // Checks — shared
  // -------------------------------------------------------------------------
  "check.missing": "Header is missing.",

  // HTTPS
  "check.https.title": "HTTPS",
  "check.https.about": "Served over TLS, HTTP redirected to HTTPS",
  "check.https.pass": "Site is served over HTTPS.",
  "check.https.upgraded": "Plain HTTP request was redirected to HTTPS.",
  "check.https.fail": "Site is served over plain HTTP.",
  "check.https.failDetail": "Traffic can be read and modified by anyone on the network path.",
  "check.https.failRec": "Serve the site over HTTPS and redirect all HTTP requests to it (301).",

  // TLS
  "check.tls.title": "TLS & certificate",
  "check.tls.about": "Negotiated protocol and certificate expiry",
  "check.tls.protocol": (p: { protocol: string }) => `Protocol: ${p.protocol}`,
  "check.tls.issuer": (p: { issuer: string }) => `Issuer: ${p.issuer}`,
  "check.tls.expires": (p: { date: string }) => `Expires: ${p.date}`,
  "check.tls.legacy": (p: { protocol: string }) => `Negotiated a deprecated protocol (${p.protocol}).`,
  "check.tls.legacyRec": "Disable TLS 1.0/1.1 and enable TLS 1.2 and 1.3.",
  "check.tls.expired": "Certificate has expired.",
  "check.tls.expiredRec": "Renew the certificate.",
  "check.tls.expiring": (p: { days: number }) => `Certificate expires in ${p.days} ${s(p.days, "day", "days")}.`,
  "check.tls.expiringRec": "Renew the certificate soon, or automate renewal (e.g. Let's Encrypt + certbot).",
  "check.tls.pass": "Modern TLS.",
  "check.tls.passDays": (p: { days: number }) =>
    `Modern TLS, certificate valid for ${p.days} more ${s(p.days, "day", "days")}.`,

  // HSTS
  "check.hsts.title": "Strict-Transport-Security",
  "check.hsts.about": "max-age ≥ 6 months, includeSubDomains, preload",
  "check.hsts.requiresHttps": "HSTS requires HTTPS.",
  "check.hsts.requiresHttpsDetail": "Browsers ignore HSTS sent over plain HTTP.",
  "check.hsts.requiresHttpsRec": "Enable HTTPS first, then send HSTS.",
  "check.hsts.missingDetail": "Without HSTS, a first visit over HTTP can be intercepted (SSL stripping).",
  "check.hsts.missingRec": "Send HSTS with a max-age of at least 6 months (ideally 2 years).",
  "check.hsts.subdomains": "Covers subdomains (includeSubDomains).",
  "check.hsts.noSubdomains": "Does not cover subdomains.",
  "check.hsts.preload": "Marked for browser preload lists.",
  "check.hsts.maxAgeInvalid": "max-age is missing or invalid.",
  "check.hsts.maxAgeZero": "max-age=0 disables HSTS.",
  "check.hsts.maxAgeRec": "Set max-age to at least 15552000 (6 months).",
  "check.hsts.short": (p: { days: number }) => `max-age is short (${p.days} ${s(p.days, "day", "days")}).`,
  "check.hsts.shortRec": "Increase max-age to at least 15552000 (6 months).",
  "check.hsts.pass": (p: { days: number }) => `Enabled for ${p.days} ${s(p.days, "day", "days")}.`,

  // CSP
  "check.csp.title": "Content-Security-Policy",
  "check.csp.about": "Enforcing policy without unsafe-inline, unsafe-eval or wildcards",
  "check.csp.reportOnly": "Only a report-only policy is set.",
  "check.csp.reportOnlyDetail": "Report-only mode logs violations but does not block anything.",
  "check.csp.reportOnlyRec": "Once the reports look clean, switch to the enforcing Content-Security-Policy header.",
  "check.csp.missingDetail": "CSP is the main browser defense against XSS and data injection.",
  "check.csp.missingRec": "Add a CSP. Start with Content-Security-Policy-Report-Only to find breakage, then enforce.",
  "check.csp.weak": (p: { count: number }) =>
    `Policy present but weak (${p.count} major ${s(p.count, "issue", "issues")}).`,
  "check.csp.weakRec": "Replace 'unsafe-inline'/'unsafe-eval' and broad sources with nonces or hashes.",
  "check.csp.minor": "Policy present, with minor suggestions.",
  "check.csp.strong": "Strong policy.",
  "check.csp.issue.noScriptSrc": "No script-src or default-src directive: scripts can load from anywhere.",
  "check.csp.issue.unsafeInline": "'unsafe-inline' allows inline scripts, which defeats most XSS protection.",
  "check.csp.issue.unsafeEval": "'unsafe-eval' allows eval() and similar, a common XSS sink.",
  "check.csp.issue.broad": (p: { sources: string }) => `Overly broad script sources: ${p.sources}.`,
  "check.csp.issue.noObjectSrc": "No object-src directive. Consider object-src 'none' to block plugins.",
  "check.csp.issue.noBaseUri": "No base-uri directive. Consider base-uri 'self' to prevent <base> tag injection.",

  // X-Content-Type-Options
  "check.xcto.title": "X-Content-Type-Options",
  "check.xcto.about": "nosniff disables MIME sniffing",
  "check.xcto.pass": "MIME sniffing is disabled.",
  "check.xcto.invalid": (p: { value: string }) => `Invalid value "${p.value}".`,
  "check.xcto.detail": "Browsers may interpret uploaded files as scripts or HTML (MIME confusion).",
  "check.xcto.rec": "Send X-Content-Type-Options: nosniff on every response.",

  // Framing
  "check.framing.title": "Clickjacking protection",
  "check.framing.about": "CSP frame-ancestors or X-Frame-Options",
  "check.framing.wildcard": "frame-ancestors allows any site to embed this page.",
  "check.framing.wildcardRec": "Restrict frame-ancestors to 'self' or trusted origins.",
  "check.framing.viaCsp": "Controlled via CSP frame-ancestors.",
  "check.framing.xfo": (p: { value: string }) => `X-Frame-Options: ${p.value}.`,
  "check.framing.xfoDetail": "Consider also adding CSP frame-ancestors, its modern replacement.",
  "check.framing.allowFrom": "ALLOW-FROM is obsolete and ignored by modern browsers.",
  "check.framing.allowFromRec": "Use CSP frame-ancestors with the allowed origin instead.",
  "check.framing.invalid": (p: { value: string }) => `Invalid X-Frame-Options value "${p.value}".`,
  "check.framing.none": "No frame-ancestors or X-Frame-Options.",
  "check.framing.detail": "Any site can embed this page in an iframe and trick users into clicking (clickjacking).",
  "check.framing.rec": "Add CSP frame-ancestors 'self' (and optionally X-Frame-Options: SAMEORIGIN for old browsers).",

  // COOP
  "check.coop.title": "Cross-Origin-Opener-Policy",
  "check.coop.about": "Isolates the browsing context from cross-origin windows",
  "check.coop.pass": (p: { value: string }) => `Browsing context isolated (${p.value}).`,
  "check.coop.weak": (p: { value: string }) => `Weak value "${p.value}".`,
  "check.coop.detail": "Cross-origin windows opened from this page keep a reference to it (XS-Leaks, tabnabbing).",
  "check.coop.rec":
    "Send Cross-Origin-Opener-Policy: same-origin (or same-origin-allow-popups if you rely on OAuth popups).",

  // Referrer-Policy
  "check.referrer.title": "Referrer-Policy",
  "check.referrer.about": "Explicit policy that doesn't leak full URLs",
  "check.referrer.missingDetail":
    "Modern browsers default to strict-origin-when-cross-origin, but older ones may leak full URLs.",
  "check.referrer.missingRec": "Set the policy explicitly.",
  "check.referrer.pass": (p: { policy: string }) => `Policy: ${p.policy}.`,
  "check.referrer.leaky": (p: { policy: string }) => `"${p.policy}" leaks full URLs to other sites.`,
  "check.referrer.unrecognized": (p: { value: string }) => `Unrecognized value "${p.value}".`,
  "check.referrer.detail": "Full URLs can contain tokens, search terms or other private data.",
  "check.referrer.rec": "Use strict-origin-when-cross-origin or stricter.",

  // Permissions-Policy
  "check.permissions.title": "Permissions-Policy",
  "check.permissions.about": "Restricts camera, microphone, geolocation…",
  "check.permissions.pass": "Browser features are restricted.",
  "check.permissions.legacyOnly": "Only the deprecated Feature-Policy header is set.",
  "check.permissions.detail": "Injected or third-party code could request camera, microphone, geolocation, etc.",
  "check.permissions.rec": "Disable the browser features your site does not use.",

  // Cookies
  "check.cookies.title": "Cookie flags",
  "check.cookies.about": "Secure, HttpOnly, SameSite and prefix rules, per cookie",
  "check.cookies.none": "No cookies set on this response.",
  "check.cookies.cookie": (p: { name: string; problems: string }) => `${p.name}: ${p.problems}`,
  "check.cookies.ok": (p: { name: string }) => `${p.name}: OK`,
  "check.cookies.fail": (p: { count: number }) =>
    `${p.count} ${s(p.count, "cookie", "cookies")}, some can leak over insecure connections.`,
  "check.cookies.failRec": "Add Secure to every cookie; add HttpOnly and SameSite to session cookies.",
  "check.cookies.warn": (p: { count: number }) =>
    `${p.count} ${s(p.count, "cookie", "cookies")}, some missing HttpOnly or SameSite.`,
  "check.cookies.warnRec":
    "Add HttpOnly to cookies JavaScript does not need to read, and set SameSite=Lax or Strict.",
  "check.cookies.pass": (p: { count: number }) => `${p.count} ${s(p.count, "cookie", "cookies")}, all properly flagged.`,
  "check.cookies.problem.missingSecure": "missing Secure",
  "check.cookies.problem.sameSiteNone": "SameSite=None without Secure (browsers reject it)",
  "check.cookies.problem.prefix": (p: { prefix: string }) => `${p.prefix} prefix requires Secure`,
  "check.cookies.problem.missingHttpOnly": "missing HttpOnly",
  "check.cookies.problem.noSameSite": "no SameSite attribute",

  // Information disclosure
  "check.disclosure.title": "Information disclosure",
  "check.disclosure.about": "Versioned Server, X-Powered-By and similar",
  "check.disclosure.server": (p: { value: string }) => `Server: ${p.value} (reveals a version number)`,
  "check.disclosure.header": (p: { name: string; value: string }) => `${p.name}: ${p.value}`,
  "check.disclosure.pass": "No technology or version details leaked.",
  "check.disclosure.warn": "Headers reveal the technology stack.",
  "check.disclosure.rec":
    "Remove or genericize these headers (e.g. server_tokens off in nginx, expose_php = Off in php.ini) so attackers can't match known CVEs.",

  // X-XSS-Protection
  "check.xxss.title": "X-XSS-Protection",
  "check.xxss.about": "Deprecated XSS auditor left enabled",
  "check.xxss.enabled": "Deprecated XSS auditor is enabled.",
  "check.xxss.disabled": "Deprecated header, correctly disabled.",
  "check.xxss.enabledDetail":
    "The XSS auditor was removed from browsers and could itself introduce leaks. Rely on CSP instead.",
  "check.xxss.rec": "Set X-XSS-Protection: 0 or remove the header.",

  // CORS
  "check.cors.title": "CORS",
  "check.cors.about": "Access-Control-Allow-Origin exposure",
  "check.cors.wildcard": "Any origin can read this response.",
  "check.cors.origin": (p: { origin: string }) => `Readable cross-origin by ${p.origin}.`,
  "check.cors.wildcardDetail": "Fine for public assets and APIs; a problem if the page contains private data.",
  "check.cors.originDetail": "Make sure this origin is intended, not reflected from the request.",
  "check.cors.credentials": "Access-Control-Allow-Credentials: true is set.",
} satisfies Record<string, string | ((p: never) => string)>;
