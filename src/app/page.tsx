import { connection } from "next/server";
import { Hero, SiteFooter, SiteHeader } from "@/components/Chrome";
import { Scanner } from "@/components/Scanner";

export default async function Home() {
  // Render per request so the CSP nonce from proxy.ts is applied to Next's scripts.
  await connection();

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-12 outline-none sm:px-6 sm:pt-20">
        <Hero />
        <Scanner />
      </main>
      <SiteFooter />
    </>
  );
}
