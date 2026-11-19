import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { InView } from "@/components/InView";
import { LaunchTrack, WaitlistForm } from "@/components/Originals";
import { asset, content } from "@/lib/content";

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
    <PageShell still="s6" alt="A row of screens in a quiet room, one glowing amber" title={o.heading} intro={o.line}>
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

      {/* the back room, up close: something is being built */}
      <section className="relative bg-ink">
        <InView threshold={0.15} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/worlds/originals-d.webp")} alt="A monitor glowing amber in a dark room, an app on it too blurred to read" loading="lazy" className="rise h-[70svh] w-full object-cover md:h-[90svh]" />
          <div aria-hidden className="absolute inset-0 [background:linear-gradient(0deg,#070a12_0%,rgb(7_10_18/0.4)_35%,transparent_60%)]" />
          <p className="rise t-title absolute bottom-12 left-[var(--gutter)] max-w-[18ch]" style={{ ["--d" as string]: "300ms" }}>{o.teaser}</p>
        </InView>
      </section>
    </PageShell>
  );
}
