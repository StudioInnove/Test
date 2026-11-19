import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { InView } from "@/components/InView";
import { LaunchTrack, WaitlistForm } from "@/components/Originals";
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
      <section className="bg-ink px-[var(--gutter)] pb-24 pt-10 md:pb-40">
        <InView threshold={0.15}>
          <LaunchTrack size="lg" />
          <div className="rise mt-12 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between" style={{ ["--d" as string]: "400ms" }}>
            <h2 className="t-title max-w-[16ch]">{o.joinLine}</h2>
            <WaitlistForm source="originals-page" size="lg" />
          </div>
        </InView>
      </section>

    </PageShell>
  );
}
