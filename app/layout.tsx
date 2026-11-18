import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { content, SITE_URL } from "@/lib/content";
import { CalWarmup } from "@/components/BookCall";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: content.seo.title, template: "%s" },
  description: content.seo.description,
  keywords: content.seo.keywords,
  applicationName: "Studio Innové",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Studio Innové",
    title: content.seo.title,
    description: content.seo.description,
    url: "/",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Studio Innové — a glass penthouse studio above the city at golden hour" }],
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title: content.seo.title, description: content.seo.description, images: ["/og.jpg"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap" />
        <noscript>
          <style>{`.reveal .w,.rise{opacity:1!important;filter:none!important;transform:none!important}[data-scene="hero"]{opacity:1!important}`}</style>
        </noscript>
      </head>
      <body>
        {children}
        <CalWarmup />
        <Analytics />
      </body>
    </html>
  );
}
