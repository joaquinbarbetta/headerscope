import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { I18nProvider } from "@/components/I18nProvider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, translate, type Locale } from "@/lib/i18n";
import "./globals.css";

// next/font downloads these at build time and serves them from our own origin,
// so the strict CSP (font-src 'self') keeps holding.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

async function requestLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  return {
    title: translate(locale, { key: "meta.title" }),
    description: translate(locale, { key: "meta.description" }),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await requestLocale();

  return (
    <html lang={locale} className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <div className="backdrop" aria-hidden />
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
