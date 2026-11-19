import type { Metadata } from "next";
import { BookCall } from "@/components/BookCall";
import { CloseUp } from "@/components/CloseUp";
import { InView } from "@/components/InView";
import { PageShell } from "@/components/PageShell";
import { Words } from "@/components/Words";
import { content } from "@/lib/content";

const p = content.pages.process;
export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: "/process" },
  openGraph: { title: p.metaTitle, description: p.metaDescription, url: "/process", images: ["/og.jpg"] },
};
const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` });

/** How we work: the four steps, told at reading pace, then the design wall from the film. */
export default function Page() {
  const { close, studio } = content;
  const w = content.worlds.how;
  return (
    <PageShell still="s5" alt="A wall of sketches and screens in a warm studio at night" title={p.headline} intro={p.intro}>
      <section className="bg-ink px-[var(--gutter)] py-24 md:py-36">
        <InView threshold={0.1}>
          <ol className="border-t border-paper/15">
            {p.steps.map((s, i) => (
              <li key={s.title} className="rise grid gap-3 border-b border-paper/15 py-8 md:grid-cols-[1.2fr_1fr] md:items-baseline md:gap-12 md:py-12" style={d(150 + i * 110)}>
                <h2 className="t-title">{s.title}</h2>
                <p className="t-lead max-w-[42ch]">{s.line}</p>
              </li>
            ))}
          </ol>
        </InView>
      </section>

      <CloseUp id="how">
        <h2 className="t-title"><Words text={w.title} /></h2>
        <p className="rise t-lead" style={d(250)}>{w.line}</p>
        <div className="rise actions" style={d(380)}>
          <BookCall>{content.nav.cta}</BookCall>
        </div>
      </CloseUp>

      <section className="bg-ink-2 px-[var(--gutter)] py-32 md:py-44">
        <InView threshold={0.2} className="stack center">
          <h2 className="t-display"><Words text={close.heading} /></h2>
          <p className="rise t-lead max-w-[34ch]" style={d(250)}>{close.line}</p>
          <div className="rise actions" style={d(380)}>
            <BookCall>{close.cta}</BookCall>
            <a href={`mailto:${studio.email}`} className="more">{close.email}</a>
          </div>
        </InView>
      </section>
    </PageShell>
  );
}
