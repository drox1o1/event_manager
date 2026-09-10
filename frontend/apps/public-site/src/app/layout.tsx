import type { Metadata, Viewport } from "next";
import { Footer } from "@cyrokx/ui";
import { SiteNavbar } from "@/components/SiteNavbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyRokx — Discover live events near you",
  description: "Find and buy tickets to live events — music, comedy, workshops, sports, food. No account needed.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteNavbar />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
