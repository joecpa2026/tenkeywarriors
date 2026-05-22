import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ten Key Warriors — Contract Accounting Jobs",
  description: "Find contract accounting jobs matched to your skills and rate.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="min-h-full flex flex-col bg-tkw-paper text-tkw-ink font-sans antialiased">
        <Nav />
        <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
