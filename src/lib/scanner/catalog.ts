/** Every check and its weight, for the pre-scan overview. Kept in sync with checks.ts by tests. */
export const CHECK_CATALOG = [
  { id: "https", weight: 20 },
  { id: "tls", weight: 10 },
  { id: "hsts", weight: 15 },
  { id: "csp", weight: 25 },
  { id: "framing", weight: 15 },
  { id: "xcto", weight: 10 },
  { id: "referrer", weight: 10 },
  { id: "permissions", weight: 5 },
  { id: "coop", weight: 5 },
  { id: "cookies", weight: 15 },
  { id: "disclosure", weight: 5 },
  { id: "xxss", weight: 0 },
  { id: "cors", weight: 0 },
] as const;
