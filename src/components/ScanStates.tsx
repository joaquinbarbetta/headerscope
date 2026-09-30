"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CHECK_CATALOG } from "@/lib/scanner/catalog";
import { GROUP_KEY, GROUP_OF, GroupIcon } from "./categories";
import { useI18n } from "./I18nProvider";

const STEPS = [
  "loading.step.validate",
  "loading.step.dns",
  "loading.step.tls",
  "loading.step.request",
  "loading.step.redirects",
  "loading.step.audit",
] as const;

/** Paces the step list; the last step stays active until the response arrives. */
const STEP_MS = 420;

/** Window chrome shared by the progress and report panels: the "product shot" frame. */
export function WindowBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-13 items-center gap-3 border-b border-line bg-panel-2/70 px-4 py-2.5 sm:px-5">
      <span className="hidden gap-1.5 sm:flex" aria-hidden>
        <span className="size-2.5 rounded-full bg-fail/70" />
        <span className="size-2.5 rounded-full bg-warn/70" />
        <span className="size-2.5 rounded-full bg-pass/70" />
      </span>
      {children}
    </div>
  );
}

function Radar() {
  return (
    <div className="relative mx-auto size-32 shrink-0 sm:mx-0 sm:size-44" aria-hidden>
      <div className="absolute inset-0 rounded-full border border-line-strong bg-panel-2/50" />
      <div className="absolute inset-[18%] rounded-full border border-line" />
      <div className="absolute inset-[36%] rounded-full border border-line" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
      <div className="absolute inset-0 animate-sweep rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_280deg,color-mix(in_oklab,var(--color-accent)_45%,transparent)_360deg)]" />
      <div className="absolute left-[64%] top-[30%] size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
      <div className="absolute left-[28%] top-[62%] size-1 rounded-full bg-violet" />
    </div>
  );
}

export function ScanProgress({ host }: { host: string }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="surface animate-fade-up overflow-hidden rounded-3xl" role="status" aria-live="polite">
      <WindowBar>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted">{host}</span>
      </WindowBar>
      <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
        <Radar />
        <div className="min-w-0 flex-1">
          <p className="truncate text-center font-display text-xl font-bold tracking-tight sm:text-left sm:text-2xl">
            {t("loading.title", { host })}
            <span className="ml-0.5 animate-blink text-accent" aria-hidden>
              _
            </span>
          </p>
          <ol className="mt-5 space-y-2.5 font-mono text-[13px]">
            {STEPS.map((key, i) => {
              const state = i < step ? "done" : i === step ? "active" : "pending";
              return (
                <li
                  key={key}
                  className={`flex items-center gap-2.5 transition-opacity duration-300 ${state === "pending" ? "opacity-40" : "opacity-100"}`}
                  aria-hidden={state === "pending"}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden>
                    {state === "done" && (
                      <svg className="size-4 text-accent" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2}>
                        <path d="m5 10.5 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {state === "active" && (
                      <svg className="size-3.5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
                        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    )}
                    {state === "pending" && <span className="size-1 rounded-full bg-muted" />}
                  </span>
                  <span className={state === "active" ? "text-ink" : "text-muted"}>{t(key)}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg className="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d={dir === "left" ? "M12.5 5 7.5 10l5 5" : "m7.5 5 5 5-5 5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Pre-scan state: the check catalog as a horizontally scrolling rail. */
export function CheckOverview() {
  const { t } = useI18n();
  const max = Math.max(...CHECK_CATALOG.map((c) => c.weight));
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  function scroll(dir: 1 | -1) {
    const el = railRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  }

  const fade = `${edges.start ? "black" : "transparent"}, black 40px, black calc(100% - 40px), ${edges.end ? "black" : "transparent"}`;

  return (
    <section aria-labelledby="overview-heading" className="animate-fade-up">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-accent">{t("empty.eyebrow")}</p>
          <h2 id="overview-heading" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("empty.title")}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">{t("empty.subtitle")}</p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => scroll(dir)}
              disabled={dir === -1 ? edges.start : edges.end}
              aria-label={t(dir === -1 ? "empty.prev" : "empty.next")}
              aria-controls="check-rail"
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-panel text-ink transition-[background-color,opacity,border-color] duration-200 hover:border-accent/60 hover:bg-panel-3 disabled:cursor-default disabled:opacity-35 disabled:hover:border-line-strong disabled:hover:bg-panel"
            >
              <Arrow dir={dir === -1 ? "left" : "right"} />
            </button>
          ))}
        </div>
      </div>

      <div
        ref={railRef}
        id="check-rail"
        role="region"
        aria-label={t("empty.carouselLabel")}
        tabIndex={0}
        onScroll={measure}
        style={{ maskImage: `linear-gradient(to right, ${fade})` }}
        className="no-scrollbar -mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-6 pt-1 sm:-mx-6 sm:scroll-px-6 sm:px-6"
      >
        <ul className="flex w-max gap-4">
          {CHECK_CATALOG.map((c, i) => {
            const group = GROUP_OF[c.category];
            return (
              <li
                key={c.id}
                style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
                className="surface group flex w-[16.5rem] shrink-0 animate-fade-up snap-start flex-col rounded-2xl p-5 transition-[transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-line-strong sm:w-[18rem]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-2 px-2.5 py-1 text-xs text-muted">
                    <GroupIcon group={group} className="size-3.5 text-accent" />
                    {t(GROUP_KEY[group])}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-muted">
                    {c.weight > 0 ? t("empty.weight", { weight: c.weight }) : t("empty.info")}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold leading-tight tracking-tight">{t(`check.${c.id}.title`)}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{t(`check.${c.id}.about`)}</p>
                <div className="mt-5 h-1 overflow-hidden rounded-full bg-panel-3" aria-hidden>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent-bright opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ width: `${c.weight > 0 ? (c.weight / max) * 100 : 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    title: "feature.request.title",
    body: "feature.request.body",
    icon: <path d="M3 10h11m0 0-4-4m4 4-4 4M17 4v12" />,
  },
  {
    title: "feature.ssrf.title",
    body: "feature.ssrf.body",
    icon: <path d="M10 2.5 3.5 5v4.6c0 3.8 2.7 6.9 6.5 8 3.8-1.1 6.5-4.2 6.5-8V5L10 2.5ZM7 10l2 2 4-4" />,
  },
  {
    title: "feature.fix.title",
    body: "feature.fix.body",
    icon: <path d="M7 6 3 10l4 4M13 6l4 4-4 4" />,
  },
] as const;

export function Highlights() {
  const { t } = useI18n();
  return (
    <ul className="mt-10 grid gap-4 md:grid-cols-3">
      {FEATURES.map((f, i) => (
        <li
          key={f.title}
          style={{ animationDelay: `${150 + i * 70}ms` }}
          className="surface animate-fade-up rounded-2xl p-6 transition-colors duration-300 hover:border-line-strong"
        >
          <span className="mb-5 inline-flex size-11 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
            <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {f.icon}
            </svg>
          </span>
          <h3 className="font-display text-lg font-bold tracking-tight">{t(f.title)}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t(f.body)}</p>
        </li>
      ))}
    </ul>
  );
}
