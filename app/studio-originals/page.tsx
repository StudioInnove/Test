import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { InView } from "@/components/InView";
import { Words } from "@/components/Words";
import { LaunchTrack, PerkCards, WaitlistForm, WarpCarousel } from "@/components/Originals";
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
      {/* where the build is, and the list */}
      <section className="bg-ink px-[var(--gutter)] pb-24 pt-6 md:pb-32">
        <InView className="mx-auto max-w-[1100px]" threshold={0.15}>
          <LaunchTrack size="lg" />
          <div className="rise mt-12 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between" style={{ ["--d" as string]: "400ms" }}>
            <p className="t-head max-w-[24ch] text-paper/85">{o.joinLine}</p>
            <WaitlistForm source="originals-page" size="lg" />
          </div>
        </InView>
      </section>

      {/* what's being made */}
      <section className="bg-ink-2 py-24 md:py-32">
        <InView className="px-[var(--gutter)]" threshold={0.1}>
          <p className="rise index mb-4">{o.eyebrow}</p>
          <h2 className="t-title"><Words text={o.projectsHeading} /></h2>
        </InView>
        <div className="mt-10">
          <WarpCarousel />
        </div>
      </section>

      {/* what joining early gets you */}
      <section className="bg-ink px-[var(--gutter)] py-24 md:py-32">
        <InView className="mx-auto max-w-[1100px]" threshold={0.1}>
          <div className="mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="t-title"><Words text={o.perksHeading} /></h2>
            <p className="rise t-body max-w-[34ch] text-paper/60" style={{ ["--d" as string]: "200ms" }}>{o.perksLine}</p>
          </div>
          <PerkCards />
          <div className="rise mt-16 flex flex-col items-center gap-3 text-center" style={{ ["--d" as string]: "600ms" }}>
            <p className="t-head">{o.cta}</p>
            <WaitlistForm source="originals-page-bottom" size="lg" />
          </div>
        </InView>
      </section>
    </PageShell>
  );
}
