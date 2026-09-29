"use client";

import { useState, type FormEvent } from "react";
import type { ScanReport } from "@/lib/scanner/types";
import { Report } from "./Report";

const EXAMPLES = ["github.com", "owasp.org", "example.com", "wikipedia.org"];

export function Scanner() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);

  async function runScan(target: string) {
    if (!target.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setReport(null);
      } else {
        setReport(data as ScanReport);
      }
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    runScan(url);
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="url" className="sr-only">
          Website URL
        </label>
        <input
          id="url"
          type="text"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-line bg-panel px-4 py-3 font-mono text-sm outline-none placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && (
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {loading ? "Scanning…" : "Scan"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setUrl(ex);
              runScan(ex);
            }}
            className="rounded-full border border-line px-3 py-0.5 font-mono text-xs hover:border-accent hover:text-ink"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mt-8 rounded-xl border border-fail/30 bg-fail/10 px-4 py-3 text-sm text-fail">
          {error}
        </div>
      )}

      {report && <Report report={report} />}
    </div>
  );
}
