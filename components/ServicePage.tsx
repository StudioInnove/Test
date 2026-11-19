import { content, href } from "@/lib/content";
import { BookCall } from "./BookCall";
import { CloseUp } from "./CloseUp";
import { Faq } from "./Faq";
import { InView } from "./InView";
import { PageShell } from "./PageShell";
import { Words } from "./Words";

/**
 * Web apps and Mobile apps: the same story as the film, told at reading pace. The room it comes from,
 * then its close-up (the screen in it works), then what we build, how it goes, questions, and the close.
 */
export function ServicePage({ kind }: { kind: "web" | "mobile" }) {
  const p = content.pages[kind];
  const w = content.worlds[kind];
  const { how, faq, close, studio } = content;
  const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` });
  return (
    <PageShell still={kind === "web" ? "s3" : "s4"} alt={kind === "web" ? "A web dashboard on a monitor in a warm studio at night" : "A phone lighting up on an oak table in a warm studio at night"} title={p.headline} intro={p.intro}>
      {/* the close-up: the screen in it is real */}
      <CloseUp id={kind} side={kind === "web" ? "right" : "left"}>
        <h2 className="t-title"><Words text={w.title} /></h2>
        <p className="rise t-lead" style={d(250)}>{w.lines.join(" ")}</p>
        <div className="rise actions" style={d(380)}>
          <BookCall>{content.nav.cta}</BookCall>
        </div>
      </CloseUp>

      {/* what we build */}
      <section className="bg-ink px-[var(--gutter)] py-24 md:py-36">
        <InView threshold={0.1} className="grid gap-12 md:grid-cols-5 md:gap-[34px]">
          <h2 className="t-title md:col-span-2"><Words text={content.services.intro} /></h2>
          <ul className="border-t border-paper/15 md:col-span-3">
            {p.points.map((pt, i) => (
              <li key={pt.title} className="rise grid gap-2 border-b border-paper/15 py-6 md:grid-cols-[1fr_1.4fr] md:items-baseline md:gap-10 md:py-8" style={d(150 + i * 110)}>
                <h3 className="t-head">{pt.title.replace(/\.$/, "")}</h3>
                <p className="t-body">{pt.line}</p>
              </li>
            ))}
          </ul>
        </InView>
      </section>

      {/* how it goes */}
      <section className="bg-ink-2 px-[var(--gutter)] py-24 md:py-36">
        <InView threshold={0.1}>
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
            <h2 className="t-title"><Words text={how.heading} /></h2>
            <a href={href("/process")} className="rise more">{content.pages.process.title}</a>
          </div>
          <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {how.steps.map((s, i) => (
              <li key={s.title} className="rise" style={d(150 + i * 120)}>
                <div className="mb-6 h-px w-full bg-paper/15">
                  <div className="steps-line h-px origin-left bg-paper" style={{ transitionDelay: `${300 + i * 220}ms` }} />
                </div>
                <h3 className="t-head">{s.title}</h3>
                <p className="t-body mt-3 max-w-[30ch]">{s.line}</p>
              </li>
            ))}
          </ol>
        </InView>
      </section>

      {/* questions */}
      <section className="bg-ink px-[var(--gutter)] py-24 md:py-36">
        <InView className="grid gap-12 md:grid-cols-5 md:gap-[34px]" threshold={0.1}>
          <h2 className="t-title md:col-span-2"><Words text={faq.heading} /></h2>
          <div className="md:col-span-3"><Faq /></div>
        </InView>
      </section>

      {/* the close: the same ending as the film */}
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
