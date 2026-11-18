import { content } from "@/lib/content";
import { BookCall } from "./BookCall";
import { Faq } from "./Faq";
import { PageShell, Section } from "./PageShell";

export function ServicePage({ kind }: { kind: "web" | "mobile" }) {
  const p = content.pages[kind];
  const { how, faq, close, studio } = content;
  return (
    <PageShell still={kind === "web" ? "s3" : "s4"} alt={kind === "web" ? "A web dashboard on a monitor in a warm studio at night" : "A phone lighting up on an oak table in a warm studio at night"} eyebrow={p.title} title={p.headline} intro={p.intro}>
      <Section>
        <ul className="grid gap-px overflow-hidden rounded-[28px] bg-white/10 ring-1 ring-white/10 md:grid-cols-3">
          {p.points.map((pt) => (
            <li key={pt.title} className="bg-ink p-8 sm:p-10">
              <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{pt.title}</h2>
              <p className="mt-3 leading-relaxed text-paper/70">{pt.line}</p>
            </li>
          ))}
        </ul>
        <div className="mt-12"><BookCall>{close.cta}</BookCall></div>
      </Section>
      <Section eyebrow="Process" title={how.heading}>
        <ol className="grid gap-10 md:grid-cols-4">
          {how.steps.map((s, i) => (
            <li key={s.title} className="border-t border-white/15 pt-6">
              <p className="eyebrow mb-3">0{i + 1}</p>
              <h3 className="text-[24px] font-semibold tracking-[-0.02em]">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-paper/70">{s.line}</p>
            </li>
          ))}
        </ol>
      </Section>
      <Section eyebrow="FAQ" title={faq.heading}>
        <div className="max-w-[860px]"><Faq /></div>
      </Section>
      <Section>
        <div className="flex flex-col items-start gap-6 rounded-[32px] bg-white/[0.035] p-8 ring-1 ring-white/10 sm:p-12 md:flex-row md:items-center md:justify-between">
          <h2 className="display text-[clamp(32px,4vw,56px)]">{close.heading}</h2>
          <div className="flex flex-wrap gap-3">
            <BookCall>{close.cta}</BookCall>
            <a href={`mailto:${studio.email}`} className="btn btn-ghost">Email us</a>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
