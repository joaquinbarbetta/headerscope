import type { Status } from "@/lib/scanner/types";

export const STATUS_LABEL: Record<Status, string> = {
  pass: "Pass",
  warn: "Warning",
  fail: "Fail",
  info: "Info",
};

export const STATUS_TEXT: Record<Status, string> = {
  pass: "text-pass",
  warn: "text-warn",
  fail: "text-fail",
  info: "text-info",
};

export const STATUS_BG: Record<Status, string> = {
  pass: "bg-pass/10 border-pass/30",
  warn: "bg-warn/10 border-warn/30",
  fail: "bg-fail/10 border-fail/30",
  info: "bg-info/10 border-info/30",
};

export function StatusIcon({ status, className = "size-5" }: { status: Status; className?: string }) {
  const common = {
    className: `${className} ${STATUS_TEXT[status]} shrink-0`,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-label": STATUS_LABEL[status],
    role: "img",
  };
  switch (status) {
    case "pass":
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="8" />
          <path d="m6.5 10.2 2.3 2.3 4.7-5" />
        </svg>
      );
    case "warn":
      return (
        <svg {...common}>
          <path d="M10 2.8 18 17H2L10 2.8Z" />
          <path d="M10 8v4M10 14.5v.01" />
        </svg>
      );
    case "fail":
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="8" />
          <path d="m7 7 6 6M13 7l-6 6" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="8" />
          <path d="M10 9v5M10 6.2v.01" />
        </svg>
      );
  }
}
