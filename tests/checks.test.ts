import { describe, expect, it } from "vitest";
import {
  checkCookies,
  checkCsp,
  checkDisclosure,
  checkFraming,
  checkHsts,
  checkHttps,
  checkReferrerPolicy,
  checkTls,
  runChecks,
} from "@/lib/scanner/checks";
import { buildReport, computeScore, gradeFor } from "@/lib/scanner";
import { HARDENED, fakeResult } from "./helpers";

describe("HSTS", () => {
  it("passes with a long max-age", () => {
    expect(checkHsts(fakeResult(HARDENED))?.status).toBe("pass");
  });
  it("fails when missing", () => {
    expect(checkHsts(fakeResult({}))?.status).toBe("fail");
  });
  it("warns on short max-age", () => {
    const r = checkHsts(fakeResult({ "Strict-Transport-Security": "max-age=3600" }));
    expect(r?.status).toBe("warn");
  });
  it("fails on max-age=0", () => {
    const r = checkHsts(fakeResult({ "Strict-Transport-Security": "max-age=0" }));
    expect(r?.status).toBe("fail");
    expect(r?.summary).toMatch(/disables/);
  });
  it("accepts quoted max-age", () => {
    const r = checkHsts(fakeResult({ "Strict-Transport-Security": 'max-age="31536000"' }));
    expect(r?.status).toBe("pass");
  });
  it("fails on plain HTTP sites", () => {
    const r = checkHsts(fakeResult(HARDENED, { finalUrl: "http://example.com/" }));
    expect(r?.status).toBe("fail");
  });
});

describe("HTTPS & TLS", () => {
  it("notes an HTTP→HTTPS upgrade", () => {
    const r = checkHttps(fakeResult({}, { requestedProtocol: "http:" }));
    expect(r?.status).toBe("pass");
    expect(r?.details[0]).toMatch(/redirected/);
  });
  it("fails plain HTTP", () => {
    expect(checkHttps(fakeResult({}, { finalUrl: "http://x.com/", tls: null }))?.status).toBe("fail");
  });
  it("skips TLS check without TLS", () => {
    expect(checkTls(fakeResult({}, { tls: null }))).toBeNull();
  });
  it("flags legacy protocols and expiring certs", () => {
    expect(checkTls(fakeResult({}, { tls: { protocol: "TLSv1", daysRemaining: 100 } }))?.status).toBe("fail");
    expect(checkTls(fakeResult({}, { tls: { protocol: "TLSv1.2", daysRemaining: 5 } }))?.status).toBe("warn");
    expect(checkTls(fakeResult({}, { tls: { protocol: "TLSv1.3", daysRemaining: 90 } }))?.status).toBe("pass");
  });
});

describe("CSP", () => {
  it("passes a strict nonce-based policy", () => {
    expect(checkCsp(fakeResult(HARDENED))?.status).toBe("pass");
  });
  it("fails when missing", () => {
    expect(checkCsp(fakeResult({}))?.status).toBe("fail");
  });
  it("warns for report-only", () => {
    const r = checkCsp(fakeResult({ "Content-Security-Policy-Report-Only": "default-src 'self'" }));
    expect(r?.status).toBe("warn");
  });
  it("warns on unsafe-inline without nonce", () => {
    const r = checkCsp(fakeResult({ "Content-Security-Policy": "default-src 'self' 'unsafe-inline'" }));
    expect(r?.status).toBe("warn");
    expect(r?.details.join(" ")).toMatch(/unsafe-inline/);
  });
  it("ignores unsafe-inline when a nonce is present (browsers do too)", () => {
    const r = checkCsp(
      fakeResult({
        "Content-Security-Policy": "script-src 'nonce-x' 'unsafe-inline'; object-src 'none'; base-uri 'none'",
      }),
    );
    expect(r?.status).toBe("pass");
  });
  it("warns on wildcard script sources", () => {
    const r = checkCsp(fakeResult({ "Content-Security-Policy": "script-src * ; object-src 'none'; base-uri 'self'" }));
    expect(r?.status).toBe("warn");
  });
});

describe("Clickjacking", () => {
  it("prefers CSP frame-ancestors", () => {
    const r = checkFraming(fakeResult(HARDENED));
    expect(r?.status).toBe("pass");
    expect(r?.value).toContain("frame-ancestors");
  });
  it("accepts X-Frame-Options SAMEORIGIN", () => {
    expect(checkFraming(fakeResult({ "X-Frame-Options": "sameorigin" }))?.status).toBe("pass");
  });
  it("warns on obsolete ALLOW-FROM", () => {
    expect(checkFraming(fakeResult({ "X-Frame-Options": "ALLOW-FROM https://a.com" }))?.status).toBe("warn");
  });
  it("fails when nothing is set", () => {
    expect(checkFraming(fakeResult({}))?.status).toBe("fail");
  });
});

describe("Referrer-Policy", () => {
  it("uses the last recognized token", () => {
    const r = checkReferrerPolicy(fakeResult({ "Referrer-Policy": "no-referrer, strict-origin-when-cross-origin" }));
    expect(r?.status).toBe("pass");
    expect(checkReferrerPolicy(fakeResult({ "Referrer-Policy": "unsafe-url" }))?.status).toBe("warn");
  });
});

describe("Cookies", () => {
  it("is informational when no cookies are set", () => {
    expect(checkCookies(fakeResult({}))?.status).toBe("info");
  });
  it("fails when Secure is missing on HTTPS", () => {
    const r = checkCookies(fakeResult({ "set-cookie": ["sid=1; HttpOnly; SameSite=Lax"] }));
    expect(r?.status).toBe("fail");
    expect(r?.details[0]).toMatch(/missing Secure/);
  });
  it("warns when HttpOnly / SameSite missing", () => {
    const r = checkCookies(fakeResult({ "set-cookie": ["pref=dark; Secure"] }));
    expect(r?.status).toBe("warn");
  });
  it("passes well-flagged cookies", () => {
    expect(checkCookies(fakeResult(HARDENED))?.status).toBe("pass");
  });
});

describe("Information disclosure", () => {
  it("flags versioned Server and X-Powered-By", () => {
    const r = checkDisclosure(fakeResult({ Server: "Apache/2.4.41 (Ubuntu)", "X-Powered-By": "PHP/7.4.3" }));
    expect(r?.status).toBe("warn");
    expect(r?.details).toHaveLength(2);
  });
  it("passes a generic Server header", () => {
    expect(checkDisclosure(fakeResult({ Server: "nginx" }))?.status).toBe("pass");
  });
});

describe("Scoring", () => {
  it("gives a hardened site an A+", () => {
    const report = buildReport("example.com", fakeResult(HARDENED));
    expect(report.score).toBe(100);
    expect(report.grade).toBe("A+");
    expect(report.counts.fail).toBe(0);
  });
  it("gives a bare HTTP site an F", () => {
    const checks = runChecks(fakeResult({}, { finalUrl: "http://example.com/", tls: null, requestedProtocol: "http:" }));
    expect(gradeFor(computeScore(checks))).toBe("F");
  });
  it("excludes info checks from the score", () => {
    expect(
      computeScore([
        { id: "a", title: "", category: "content", status: "pass", summary: "", details: [], weight: 10, reference: "" },
        { id: "b", title: "", category: "content", status: "info", summary: "", details: [], weight: 0, reference: "" },
      ]),
    ).toBe(100);
  });
});
