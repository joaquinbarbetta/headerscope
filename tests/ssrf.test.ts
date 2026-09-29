import { describe, expect, it } from "vitest";
import { TargetError, isPublicAddress, validateTarget } from "@/lib/scanner/ssrf";

describe("isPublicAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254", // cloud metadata
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::",
    "fe80::1",
    "fd00::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::ffff:a9fe:a9fe", // 169.254.169.254 in hex
    "64:ff9b::10.0.0.1",
  ])("blocks %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  it.each(["8.8.8.8", "1.1.1.1", "172.32.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"])("allows %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(true);
  });

  it("rejects non-IP input", () => {
    expect(isPublicAddress("example.com")).toBe(false);
  });
});

describe("validateTarget", () => {
  it("adds https:// when no scheme is given", () => {
    expect(validateTarget("example.com").toString()).toBe("https://example.com/");
  });
  it("keeps http:// when explicit", () => {
    expect(validateTarget("http://example.com").protocol).toBe("http:");
  });

  it.each([
    ["", /enter a URL/],
    ["ftp://example.com", /Only http/],
    ["file:///etc/passwd", /Only http/],
    ["javascript:alert(1)", /valid URL|Only http/],
    ["http://localhost:3000", /ports|Local/],
    ["http://localhost", /Local/],
    ["http://app.internal", /Local/],
    ["http://127.0.0.1", /Private/],
    ["http://[::1]", /Private/],
    ["http://169.254.169.254/latest/meta-data", /Private/],
    ["http://2130706433", /Private|full domain/], // decimal 127.0.0.1
    ["http://0x7f.1", /Private|full domain/],
    ["https://user:pass@example.com", /credentials/],
    ["https://example.com:22", /ports/],
    ["http://intranet", /full domain/],
  ])("rejects %s", (input, msg) => {
    expect(() => validateTarget(input)).toThrow(TargetError);
    expect(() => validateTarget(input)).toThrow(msg);
  });

  it("allows standard alternate ports", () => {
    expect(validateTarget("https://example.com:8443").port).toBe("8443");
  });
});
