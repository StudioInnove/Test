import { content } from "@/lib/content";
import { BookCall } from "./BookCall";
import { Faq } from "./Faq";
import { InView } from "./InView";
import { PageShell } from "./PageShell";
import { EmailPill } from "./ui/EmailPill";
import { Words } from "./Words";

/** Web apps and Mobile apps: the same story as the film, told at reading pace. */
export function ServicePage({ kind }: { kind: "web" | "mobile" }) {
  const p = content.pages[kind];
  const { how, faq, close, studio } = content;
  return (
    <PageShell still={kind === "web" ? "s3" : "s4"} alt={kind === "web" ? "A web dashboard on a monitor in a warm studio at night" : "A phone lighting up on an oak table in a warm studio at night"} eyebrow={p.title} title={p.headline} intro={p.intro}>
      {/* What we build: big words on fine rules */}
      <section className="bg-ink px-[var(--gutter)] py-24 md:py-36">
        <InView threshold={0.1}>
          <p className="rise mb-10 text-[13px] text-paper/45 md:mb-14">What we build</p>
          <ul className="border-t border-paper/15">
            {p.points.map((pt, i) => (
              <li key={pt.title} className="rise grid gap-3 border-b border-paper/15 py-8 md:grid-cols-[1.2fr_1fr] md:items-baseline md:gap-12 md:py-12" style={{ ["--d" as string]: `${150 + i * 110}ms` }}>
                <h2 className="text-[clamp(40px,5.6vw,92px)] font-[320] leading-[0.95] tracking-[-0.045em]">{pt.title.replace(/\.$/, "")}</h2>
                <p className="max-w-[38ch] text-[18px] leading-[1.5] tracking-[-0.01em] text-paper/65">{pt.line}</p>
              </li>
            ))}
          </ul>
        </InView>
      </section>

      {/* How it goes: four steps in a row */}
      <section className="bg-ink-2 px-[var(--gutter)] py-24 md:py-36">
        <InView threshold={0.1}>
          <h2 className="mb-12 text-[clamp(36px,4.4vw,64px)] font-[320] leading-none tracking-[-0.04em] md:mb-16"><Words text={how.heading} /></h2>
          <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {how.steps.map((s, i) => (
              <li key={s.title} className="rise" style={{ ["--d" as string]: `${150 + i * 120}ms` }}>
                <div className="mb-7 h-px w-full bg-paper/15">
                  <div className="steps-line h-px origin-left bg-paper" style={{ transitionDelay: `${300 + i * 220}ms` }} />
                </div>
                <h3 className="text-[clamp(30px,2.8vw,44px)] font-[320] leading-none tracking-[-0.04em]">{s.title}</h3>
                <p className="mt-4 max-w-[30ch] text-[16px] leading-[1.5] text-paper/65">{s.line}</p>
              </li>
            ))}
          </ol>
        </InView>
      </section>

      {/* Questions */}
      <section className="bg-ink px-[var(--gutter)] py-24 md:py-36">
        <InView className="grid gap-12 md:grid-cols-5 md:gap-[34px]" threshold={0.1}>
          <h2 className="text-[clamp(36px,4.4vw,64px)] font-[320] leading-none tracking-[-0.04em] md:col-span-2"><Words text={faq.heading} /></h2>
          <div className="md:col-span-3"><Faq /></div>
        </InView>
      </section>

      {/* Close: one big line and the two ways to reach us */}
      <section className="bg-ink-2 px-[var(--gutter)] py-28 md:py-40">
        <InView threshold={0.2}>
          <h2 className="max-w-[14ch] text-[clamp(48px,7vw,120px)] font-[320] leading-[0.95] tracking-[-0.045em]">
            <Words text={close.heading} /> <span className="text-paper/55"><Words text={close.sub} delay={160} /></span>
          </h2>
          <div className="rise mt-12 flex flex-col gap-10 md:flex-row md:items-end md:justify-between" style={{ ["--d" as string]: "500ms" }}>
            <BookCall>{close.cta}</BookCall>
            <EmailPill email={studio.email} />
          </div>
        </InView>
      </section>
    </PageShell>
  );
}
