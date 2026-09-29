import { connection } from "next/server";
import { Scanner } from "@/components/Scanner";

export default async function Home() {
  // Render per request so the CSP nonce from proxy.ts is applied to Next's scripts.
  await connection();

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:py-24">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs text-muted">
            <svg className="size-3.5 text-accent" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M10 2 3 5v5c0 4 3 7 7 8 4-1 7-4 7-8V5l-7-3Z" />
            </svg>
            HeaderScope
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            How secure are your <span className="text-accent">HTTP headers</span>?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted">
            Scan any website for CSP, HSTS, clickjacking protection, cookie flags and more. Get a grade and concrete
            fixes in seconds.
          </p>
        </div>
        <Scanner />
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        <p>
          Only scan sites you own or have permission to test. HeaderScope sends a single GET request and reads the
          response headers.
        </p>
      </footer>
    </>
  );
}
