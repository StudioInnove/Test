import { content, href } from "@/lib/content";
import { BookCall } from "./BookCall";
import { Faq } from "./Faq";
import { InView } from "./InView";
import { PageShell } from "./PageShell";
import { Words } from "./Words";

/** Web apps and Mobile apps: the same story as the film, told at reading pace. */
export function ServicePage({ kind }: { kind: "web" | "mobile" }) {
  const p = content.pages[kind];
  const { how, faq, close, studio } = content;
  return (
    <PageShell still={kind === "web" ? "s3" : "s4"} alt={kind === "web" ? "A web dashboard on a monitor in a warm studio at night" : "A phone lighting up on an oak table in a warm studio at night"} title={p.headline} intro={p.intro}>
      {/* What we build: big words on fine rules */}
      <section className="bg-ink px-[var(--gutter)] py-24 md:py-36">
        <InView threshold={0.1}>
          <ul className="border-t border-paper/15">
            {p.points.map((pt, i) => (
              <li key={pt.title} className="rise grid gap-3 border-b border-paper/15 py-8 md:grid-cols-[1.2fr_1fr] md:items-baseline md:gap-12 md:py-12" style={{ ["--d" as string]: `${150 + i * 110}ms` }}>
                <h2 className="t-title">{pt.title.replace(/\.$/, "")}</h2>
                <p className="t-lead max-w-[38ch]">{pt.line}</p>
              </li>
            ))}
          </ul>
        </InView>
      </section>

      {/* How it goes: four steps in a row */}
      <section className="bg-ink-2 px-[var(--gutter)] py-24 md:py-36">
        <InView threshold={0.1}>
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
            <h2 className="t-title"><Words text={how.heading} /></h2>
            <a href={href("/process")} className="rise more">{content.pages.process.title}</a>
          </div>
          <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {how.steps.map((s, i) => (
              <li key={s.title} className="rise" style={{ ["--d" as string]: `${150 + i * 120}ms` }}>
                <div className="mb-7 h-px w-full bg-paper/15">
                  <div className="steps-line h-px origin-left bg-paper" style={{ transitionDelay: `${300 + i * 220}ms` }} />
                </div>
                <h3 className="t-title">{s.title}</h3>
                <p className="t-body mt-4 max-w-[30ch]">{s.line}</p>
              </li>
            ))}
          </ol>
        </InView>
      </section>

      {/* Questions */}
      <section className="bg-ink px-[var(--gutter)] py-24 md:py-36">
        <InView className="grid gap-12 md:grid-cols-5 md:gap-[34px]" threshold={0.1}>
          <h2 className="t-title md:col-span-2"><Words text={faq.heading} /></h2>
          <div className="md:col-span-3"><Faq /></div>
        </InView>
      </section>

      {/* Close: the same ending as the film */}
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
