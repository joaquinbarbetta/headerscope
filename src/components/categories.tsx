import type { Category, CheckResult, Status } from "@/lib/scanner/types";

/** The report tabs. The scanner's finer categories are folded into four groups for the UI. */
export const GROUPS = ["transport", "content", "cookies", "privacy"] as const;
export type Group = (typeof GROUPS)[number];

export const GROUP_OF: Record<Category, Group> = {
  transport: "transport",
  content: "content",
  framing: "content",
  cookies: "cookies",
  privacy: "privacy",
  disclosure: "privacy",
};

export const GROUP_KEY = {
  transport: "category.transport",
  content: "category.content",
  cookies: "category.cookies",
  privacy: "category.privacy",
} as const satisfies Record<Group, string>;

/** Same weighting as the overall score: pass = full, warning = half, fail = 0, info not scored. */
const CREDIT: Record<Status, number | null> = { pass: 1, warn: 0.5, fail: 0, info: null };

export function groupScore(checks: CheckResult[]): number | null {
  let total = 0;
  let earned = 0;
  for (const c of checks) {
    const credit = CREDIT[c.status];
    if (credit === null || c.weight === 0) continue;
    total += c.weight;
    earned += c.weight * credit;
  }
  return total === 0 ? null : Math.round((earned / total) * 100);
}

export function scoreColor(score: number): string {
  if (score >= 85) return "bg-pass";
  if (score >= 55) return "bg-warn";
  return "bg-fail";
}

export function GroupIcon({ group, className = "size-4" }: { group: Group; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (group) {
    case "transport":
      return (
        <svg {...common}>
          <rect x="4" y="9" width="12" height="8" rx="2" />
          <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
        </svg>
      );
    case "content":
      return (
        <svg {...common}>
          <path d="m7 6-4 4 4 4M13 6l4 4-4 4M11 4.5l-2 11" />
        </svg>
      );
    case "cookies":
      return (
        <svg {...common}>
          <path d="M17 10.5A7 7 0 1 1 9.5 3a2.5 2.5 0 0 0 3 3 2.5 2.5 0 0 0 4.5 4.5Z" />
          <path d="M7.5 9v.01M11 13v.01M7 13.5v.01" strokeWidth={2.2} />
        </svg>
      );
    case "privacy":
      return (
        <svg {...common}>
          <path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5Z" />
          <circle cx="10" cy="10" r="2.2" />
        </svg>
      );
  }
}
