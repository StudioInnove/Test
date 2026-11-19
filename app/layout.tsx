import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { content, SITE_URL } from "@/lib/content";
import { CalWarmup } from "@/components/BookCall";
import { Magnetic } from "@/components/ui/Magnetic";
import "@fontsource-variable/inter/opsz.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
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
  themeColor: "#070a12",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <noscript>
          <style>{`.reveal .w,.rise{opacity:1!important;filter:none!important;transform:none!important}[data-scene="hero"]{opacity:1!important}`}</style>
        </noscript>
      </head>
      <body>
        {children}
        <CalWarmup />
        <Magnetic />
        <Analytics />
      </body>
    </html>
  );
}
