import type { Metadata } from "next";
import { BookCall } from "@/components/BookCall";
import { InView } from "@/components/InView";
import { PageShell } from "@/components/PageShell";
import { Words } from "@/components/Words";
import { asset, content } from "@/lib/content";

const p = content.pages.process;
export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: "/process" },
  openGraph: { title: p.metaTitle, description: p.metaDescription, url: "/process", images: ["/og.jpg"] },
};

/** How we work: the four steps, told at reading pace, with the design wall from the film. */
export default function Page() {
  const { close, studio } = content;
  return (
    <PageShell still="s5" alt="A wall of sketches and screens in a warm studio at night" title={p.headline} intro={p.intro}>
      <section className="bg-ink px-[var(--gutter)] py-24 md:py-36">
        <InView threshold={0.1}>
          <ol className="border-t border-paper/15">
            {p.steps.map((s, i) => (
              <li key={s.title} className="rise grid gap-3 border-b border-paper/15 py-8 md:grid-cols-[1.2fr_1fr] md:items-baseline md:gap-12 md:py-12" style={{ ["--d" as string]: `${150 + i * 110}ms` }}>
                <h2 className="t-title">{s.title}</h2>
                <p className="t-lead max-w-[42ch]">{s.line}</p>
              </li>
            ))}
          </ol>
        </InView>
      </section>

      <section className="relative bg-ink-2">
        <InView threshold={0.15} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/worlds/how-d.webp")} alt="Sketches for every screen, pinned to the studio wall" loading="lazy" className="rise h-[70svh] w-full object-cover md:h-[86svh]" />
          <div aria-hidden className="absolute inset-0 [background:linear-gradient(0deg,#0a0e19_0%,transparent_40%)]" />
          <p className="rise t-lead absolute bottom-10 left-[var(--gutter)] max-w-[38ch] !text-paper" style={{ ["--d" as string]: "300ms" }}>{content.worlds.how.line}</p>
        </InView>
      </section>

      <section className="bg-ink-2 px-[var(--gutter)] py-32 md:py-44">
        <InView threshold={0.2} className="stack center">
          <h2 className="t-display"><Words text={close.heading} /></h2>
          <p className="rise t-lead max-w-[34ch]" style={{ ["--d" as string]: "250ms" }}>{close.line}</p>
          <div className="rise actions" style={{ ["--d" as string]: "380ms" }}>
            <BookCall>{close.cta}</BookCall>
            <a href={`mailto:${studio.email}`} className="more">{close.email}</a>
          </div>
        </InView>
      </section>
    </PageShell>
  );
}
