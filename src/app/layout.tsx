import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HeaderScope — HTTP security headers scanner",
  description:
    "Scan any website's HTTP response headers, get a security grade and concrete fixes for CSP, HSTS, cookies, clickjacking and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
