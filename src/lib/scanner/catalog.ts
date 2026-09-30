/** Every check with its weight and category, for the pre-scan overview. Kept in sync with checks.ts by tests. */
export const CHECK_CATALOG = [
  { id: "https", weight: 20, category: "transport" },
  { id: "tls", weight: 10, category: "transport" },
  { id: "hsts", weight: 15, category: "transport" },
  { id: "csp", weight: 25, category: "content" },
  { id: "framing", weight: 15, category: "framing" },
  { id: "xcto", weight: 10, category: "content" },
  { id: "referrer", weight: 10, category: "privacy" },
  { id: "permissions", weight: 5, category: "privacy" },
  { id: "coop", weight: 5, category: "framing" },
  { id: "cookies", weight: 15, category: "cookies" },
  { id: "disclosure", weight: 5, category: "disclosure" },
  { id: "xxss", weight: 0, category: "content" },
  { id: "cors", weight: 0, category: "content" },
] as const;
