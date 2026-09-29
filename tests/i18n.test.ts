import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DICTIONARIES, LOCALES, isLocale, msg, translate, translator } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";
import { es } from "@/lib/i18n/es";
import { TARGET_ERRORS, scanErrorMessage } from "@/lib/i18n/errors";
import { buildReport } from "@/lib/scanner";
import { CHECK_CATALOG } from "@/lib/scanner/catalog";
import { runChecks } from "@/lib/scanner/checks";
import { TargetError } from "@/lib/scanner/ssrf";
import { HARDENED, fakeResult } from "./helpers";

/** A site with a bit of everything wrong, so most message branches run. */
const WEAK = fakeResult(
  {
    "content-security-policy": "default-src * 'unsafe-inline' 'unsafe-eval'",
    "x-frame-options": "ALLOW-FROM https://a.example",
    "referrer-policy": "unsafe-url",
    "strict-transport-security": "max-age=3600",
    "set-cookie": ["sid=1; SameSite=None", "__Host-id=2; Path=/"],
    "x-powered-by": "PHP/8.1.2",
    server: "Apache/2.4.41",
    "x-xss-protection": "1; mode=block",
    "access-control-allow-origin": "*",
    "access-control-allow-credentials": "true",
  },
  { tls: { protocol: "TLSv1.2", daysRemaining: 1, issuer: "Test CA", validTo: "Jan 1 2030" } },
);

describe("dictionaries", () => {
  it("have exactly the same keys in every locale", () => {
    const keys = Object.keys(en).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(DICTIONARIES[locale]).sort()).toEqual(keys);
    }
  });

  it("use the same kind of entry (string vs. function) for each key", () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(typeof es[key], key).toBe(typeof en[key]);
    }
  });

  it("have no empty translations", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(DICTIONARIES[locale])) {
        if (typeof value === "string") expect(value.trim(), `${locale}:${key}`).not.toBe("");
      }
    }
  });

  it("interpolates params and nested messages", () => {
    const t = translator("es");
    expect(t("check.hsts.pass", { days: 1 })).toBe("Activo por 1 día.");
    expect(t("check.hsts.pass", { days: 730 })).toBe("Activo por 730 días.");
    expect(
      translate("es", msg("check.cookies.cookie", { name: "sid", problems: [msg("check.cookies.problem.missingSecure")] })),
    ).toBe("sid: falta Secure");
  });

  it("recognizes supported locales only", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("Spanish report", () => {
  const report = buildReport("example.com", WEAK, "es");

  it("is tagged with its language", () => {
    expect(report.lang).toBe("es");
  });

  it("renders every check in Spanish", () => {
    const hsts = report.checks.find((c) => c.id === "hsts")!;
    expect(hsts.summary).toBe("max-age es corto (0 días).");
    expect(hsts.recommendation).toBe("Aumentá max-age a al menos 15552000 (6 meses).");

    const framing = report.checks.find((c) => c.id === "framing")!;
    expect(framing.title).toBe("Protección contra clickjacking");

    const cookies = report.checks.find((c) => c.id === "cookies")!;
    expect(cookies.summary).toBe("2 cookies; algunas pueden filtrarse por conexiones inseguras.");
    expect(cookies.details).toContain(
      "__Host-id: falta Secure, el prefijo __Host- requiere Secure, falta HttpOnly, sin atributo SameSite",
    );

    const csp = report.checks.find((c) => c.id === "csp")!;
    expect(csp.summary).toBe("Hay política, pero es débil (3 problemas graves).");
  });

  it("keeps header names and examples untranslated", () => {
    const csp = report.checks.find((c) => c.id === "csp")!;
    const english = buildReport("example.com", WEAK, "en").checks.find((c) => c.id === "csp")!;
    expect(csp.example).toBe(english.example);
    expect(csp.value).toBe(english.value);
    expect(report.checks.find((c) => c.id === "hsts")!.title).toBe("Strict-Transport-Security");
  });

  it("never leaks raw message keys", () => {
    for (const c of report.checks) {
      for (const text of [c.title, c.summary, c.recommendation ?? "", ...c.details]) {
        expect(text).not.toMatch(/^(check|error|report)\.[\w.]+$/);
      }
    }
  });

  it("differs from the English report only in text, not in results", () => {
    const englishReport = buildReport("example.com", WEAK, "en");
    expect(report.score).toBe(englishReport.score);
    expect(report.grade).toBe(englishReport.grade);
    expect(report.checks.map((c) => [c.id, c.status])).toEqual(englishReport.checks.map((c) => [c.id, c.status]));
    expect(report.checks.find((c) => c.id === "https")!.summary).not.toBe(englishReport.checks[0].summary);
  });

  it("carries messages that re-render in any locale", () => {
    const englishReport = buildReport("example.com", WEAK, "en");
    report.checks.forEach((c, i) => {
      const en = englishReport.checks[i];
      expect(translate("en", c.messages.summary)).toBe(en.summary);
      expect(c.messages.details.map((m) => translate("en", m))).toEqual(en.details);
      expect(translate("es", c.messages.title)).toBe(c.title);
    });
    // The payload must survive JSON serialization (it travels over the API).
    const roundTrip = JSON.parse(JSON.stringify(report.checks[0].messages));
    expect(translate("es", roundTrip.summary)).toBe(report.checks[0].summary);
  });

  it("defaults to English", () => {
    expect(buildReport("example.com", fakeResult(HARDENED)).checks[0].summary).toBe("Site is served over HTTPS.");
  });
});

describe("error messages", () => {
  it("cover every TargetError the scanner core can throw", () => {
    const sources = ["src/lib/scanner/ssrf.ts", "src/lib/scanner/fetcher.ts"].map((f) => readFileSync(f, "utf8")).join("\n");
    const literals = [...sources.matchAll(/new TargetError\("([^"]+)"\)/g)].map((m) => m[1]);
    expect(literals.length).toBeGreaterThan(5);
    for (const text of literals) expect(TARGET_ERRORS, text).toHaveProperty([text]);
  });

  it("translates templated and network errors", () => {
    expect(translate("es", scanErrorMessage(new TargetError("Too many redirects (more than 5).")))).toBe(
      "Demasiadas redirecciones (más de 5).",
    );
    expect(translate("es", scanErrorMessage(new Error("Timed out after 8s.")))).toBe(
      "Se agotó el tiempo de espera (8 s).",
    );
    expect(translate("es", scanErrorMessage(Object.assign(new Error("x"), { code: "ENOTFOUND" })))).toBe(
      "No se encontró el dominio. Revisá cómo está escrito.",
    );
    expect(translate("en", scanErrorMessage(new TargetError("Please enter a URL.")))).toBe("Please enter a URL.");
  });
});

describe("check catalog", () => {
  it("matches the checks the scanner actually runs", () => {
    const ran = runChecks(WEAK).map((c) => ({ id: c.id, weight: c.weight }));
    expect(ran).toEqual(CHECK_CATALOG.map((c) => ({ id: c.id, weight: c.weight })));
  });

  it("has a description for every check in every locale", () => {
    for (const { id } of CHECK_CATALOG) {
      for (const locale of LOCALES) expect(DICTIONARIES[locale]).toHaveProperty([`check.${id}.about`]);
    }
  });
});
