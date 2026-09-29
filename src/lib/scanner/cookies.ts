export interface ParsedCookie {
  name: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: "strict" | "lax" | "none" | null;
}

export function parseSetCookie(header: string): ParsedCookie {
  const [pair, ...attrs] = header.split(";");
  const name = pair.split("=")[0].trim();
  let secure = false;
  let httpOnly = false;
  let sameSite: ParsedCookie["sameSite"] = null;

  for (const attr of attrs) {
    const [key, ...rest] = attr.trim().split("=");
    const k = key.toLowerCase();
    const v = rest.join("=").trim().toLowerCase();
    if (k === "secure") secure = true;
    else if (k === "httponly") httpOnly = true;
    else if (k === "samesite" && (v === "strict" || v === "lax" || v === "none")) sameSite = v;
  }
  return { name, secure, httpOnly, sameSite };
}

/** Problems with a single cookie. `https` = whether the site is served over TLS. */
export function cookieProblems(c: ParsedCookie, https: boolean): { critical: string[]; minor: string[] } {
  const critical: string[] = [];
  const minor: string[] = [];

  if (https && !c.secure) critical.push("missing Secure");
  if (c.sameSite === "none" && !c.secure) critical.push("SameSite=None without Secure (browsers reject it)");
  if (c.name.startsWith("__Host-") || c.name.startsWith("__Secure-")) {
    if (!c.secure) critical.push(`${c.name.split("-")[0]}- prefix requires Secure`);
  }
  if (!c.httpOnly) minor.push("missing HttpOnly");
  if (c.sameSite === null) minor.push("no SameSite attribute");

  return { critical, minor };
}
