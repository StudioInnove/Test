import type { Metadata } from "next";
import { ServicePage } from "@/components/ServicePage";
import { content } from "@/lib/content";

const p = content.pages.mobile;
export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: "/mobile-app-development" },
  openGraph: { title: p.metaTitle, description: p.metaDescription, url: "/mobile-app-development", images: ["/og.jpg"] },
};

export default function Page() {
  return <ServicePage kind="mobile" />;
}
