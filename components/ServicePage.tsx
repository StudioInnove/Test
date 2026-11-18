import { content } from "@/lib/content";
import { BookCall } from "./BookCall";
import { Faq } from "./Faq";
import { PageShell, Section } from "./PageShell";
import { ArrowLink } from "./ui/ArrowLink";

export function ServicePage({ kind }: { kind: "web" | "mobile" }) {
  const p = content.pages[kind];
  const { how, faq, close, studio } = content;
  return (
    <PageShell still={kind === "web" ? "s3" : "s4"} alt={kind === "web" ? "A web dashboard on a monitor in a warm studio at night" : "A phone lighting up on an oak table in a warm studio at night"} eyebrow={p.title} title={p.headline} intro={p.intro}>
      <Section title="What we build">
        <ul className="border-t-[0.5px] border-white/20">
          {p.points.map((pt, i) => (
            <li key={pt.title} className="rise grid grid-cols-[44px_1fr] gap-2 border-b-[0.5px] border-white/20 py-7 sm:grid-cols-[72px_1fr]" style={{ ["--d" as string]: `${200 + i * 90}ms` }}>
              <span className="index pt-1.5">0{i + 1}</span>
              <div>
                <h3 className="t-head">{pt.title.replace(/\.$/, "")}</h3>
                <p className="t-body muted mt-2 max-w-[46ch]">{pt.line}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="rise mt-10" style={{ ["--d" as string]: "600ms" }}><BookCall>{close.cta}</BookCall></div>
      </Section>
      <Section title={how.heading} tone="ink-2">
        <ol className="grid gap-x-[34px] gap-y-10 border-t-[0.5px] border-white/20 pt-7 sm:grid-cols-2">
          {how.steps.map((s, i) => (
            <li key={s.title} className="rise" style={{ ["--d" as string]: `${200 + i * 90}ms` }}>
              <p className="index mb-3">0{i + 1}</p>
              <h3 className="t-head">{s.title}</h3>
              <p className="t-body muted mt-2 max-w-[34ch]">{s.line}</p>
            </li>
          ))}
        </ol>
      </Section>
      <Section title={faq.heading}>
        <Faq />
      </Section>
      <Section title={`${close.heading} ${close.sub}`} tone="ink-2">
        <div className="rise flex flex-wrap items-center gap-6">
          <BookCall>{close.cta}</BookCall>
          <ArrowLink href={`mailto:${studio.email}`}>{studio.email}</ArrowLink>
        </div>
      </Section>
    </PageShell>
  );
}
