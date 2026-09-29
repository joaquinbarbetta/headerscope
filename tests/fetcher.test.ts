import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fetchHeaders } from "@/lib/scanner/fetcher";
import { scan } from "@/lib/scanner";
import { TargetError } from "@/lib/scanner/ssrf";

let server: http.Server;
let base: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    switch (req.url) {
      case "/redirect":
        res.writeHead(301, { Location: "/final" }).end();
        return;
      case "/loop":
        res.writeHead(302, { Location: "/loop" }).end();
        return;
      default:
        res.setHeader("Set-Cookie", ["a=1; HttpOnly", "b=2; Secure; HttpOnly; SameSite=Strict"]);
        res.setHeader("X-Powered-By", "Express");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.end("hello");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

describe("fetchHeaders", () => {
  it("refuses local targets by default (SSRF guard)", async () => {
    await expect(fetchHeaders(base)).rejects.toBeInstanceOf(TargetError);
  });

  it("reads headers and keeps multiple Set-Cookie values", async () => {
    const r = await fetchHeaders(`${base}/`, { allowPrivate: true });
    expect(r.status).toBe(200);
    expect(r.headers["x-powered-by"]).toBe("Express");
    expect(r.headers["set-cookie"]).toHaveLength(2);
    expect(r.tls).toBeNull();
  });

  it("follows redirects and records the chain", async () => {
    const r = await fetchHeaders(`${base}/redirect`, { allowPrivate: true });
    expect(r.finalUrl).toBe(`${base}/final`);
    expect(r.redirects).toEqual([{ url: `${base}/redirect`, status: 301 }]);
  });

  it("stops redirect loops", async () => {
    await expect(fetchHeaders(`${base}/loop`, { allowPrivate: true })).rejects.toThrow(/Too many redirects/);
  });

  it("produces a full report", async () => {
    const report = await scan(`${base}/`, { allowPrivate: true });
    expect(report.grade).toBe("F");
    expect(report.checks.find((c) => c.id === "disclosure")?.status).toBe("warn");
    expect(report.checks.find((c) => c.id === "xcto")?.status).toBe("pass");
  });
});
