import type { Metadata, Viewport } from "next";
import { Footer } from "@showtik/ui";
import { publicApi } from "@showtik/api-client";
import { SiteNavbar } from "@/components/SiteNavbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Showtik — Discover live events near you",
  description: "Find and buy tickets to live events — music, comedy, workshops, sports, food. No account needed.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Site-wide chrome the super admin controls (categories, cities, footer
  // tagline + link columns). Fetched once here so every page shows the same
  // admin-edited content; falls back to the API's own defaults on error so a
  // slow/unreachable backend never breaks the shell.
  const [{ categories }, chrome] = await Promise.all([
    publicApi.listCategories().catch(() => ({ categories: [] })),
    publicApi.getSiteChrome().catch(() => ({ cities: [], footer: { tagline: undefined, columns: undefined } })),
  ]);
  const categoryNames = categories.map((c) => c.name);

  return (
    <html lang="en">
      <body>
        <SiteNavbar categories={categoryNames.length > 0 ? categoryNames : undefined} cities={chrome.cities.length > 0 ? chrome.cities : undefined} />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer tagline={chrome.footer.tagline} columns={chrome.footer.columns} />
      </body>
    </html>
  );
}
