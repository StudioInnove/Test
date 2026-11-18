import type { Metadata } from "next";
import { PageShell, Section } from "@/components/PageShell";
import { StatusTrack, WaitlistForm } from "@/components/Originals";
import { content } from "@/lib/content";

const p = content.pages.originalsPage;
export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: "/studio-originals" },
  openGraph: { title: p.metaTitle, description: p.metaDescription, url: "/studio-originals", images: ["/og.jpg"] },
};

export default function Page() {
  const o = content.originals;
  return (
    <PageShell still="s6" alt="A row of screens in a quiet room, one glowing amber" eyebrow={o.eyebrow} title={o.heading} intro={o.line}>
      <Section title="Original 01">
        <div className="rise max-w-[480px]">
          <p className="t-body muted">In development. Join the list and you&apos;ll be the first to try it.</p>
          <div className="mt-8"><StatusTrack /></div>
          <div className="mt-8"><WaitlistForm source="originals-page" /></div>
        </div>
      </Section>
    </PageShell>
  );
}
