import type { Metadata } from "next";
import { PageShell, Section } from "@/components/PageShell";
import { BuildLog, StatusTrack, WaitlistForm } from "@/components/Originals";
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
    <PageShell still="s6" alt="A row of screens in a quiet room, one glowing amber" eyebrow={p.title} title={o.heading} intro={p.intro}>
      <Section>
        <article className="grid gap-10 rounded-[32px] bg-white/[0.035] p-8 ring-1 ring-white/10 sm:p-12 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow mb-3 text-amber/90">Original 01 · In the works</p>
            <h2 className="display text-[clamp(30px,3.4vw,48px)]">Coming soon.</h2>
            <p className="mt-4 max-w-[46ch] leading-relaxed text-paper/70">We&apos;re designing it now. Join the list and you&apos;ll be first to try it.</p>
            <div className="mt-8 max-w-[520px]"><WaitlistForm source="originals-page" /></div>
          </div>
          <div className="space-y-10">
            <StatusTrack />
            <BuildLog />
          </div>
        </article>
      </Section>
    </PageShell>
  );
}
