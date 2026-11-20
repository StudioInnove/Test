import type { Metadata } from "next";
import { ServicePage } from "@/components/ServicePage";
import { content } from "@/lib/content";

const p = content.pages.sites;
export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: "/website-design" },
  openGraph: { title: p.metaTitle, description: p.metaDescription, url: "/website-design", images: ["/og.jpg"] },
};

export default function Page() {
  return <ServicePage kind="sites" />;
}
