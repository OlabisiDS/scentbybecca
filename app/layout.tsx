import "./globals.css";
import type { Metadata, Viewport } from "next";
import Shell from "@/components/Shell";
import { SITE } from "@/lib/util";
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "ScentbyBecca | A scent that lingers", template: "%s | ScentbyBecca" },
  description: "Luxurious and affordable fragrances from ScentbyBecca. Find your scent. Own your presence.",
  openGraph: { siteName: "ScentbyBecca", type: "website", images: [{ url: "/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { themeColor: "#171512", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=EB+Garamond:wght@400;500&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@1&display=swap" />
      </head>
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
