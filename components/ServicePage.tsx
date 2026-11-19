import { content } from "@/lib/content";
import { Faq } from "./Faq";
import { InView } from "./InView";
import { PageShell } from "./PageShell";
import { Backdrop } from "./page/Backdrop";
import { Finale } from "./page/Finale";
import { Journey } from "./page/Journey";
import { ServiceIndex } from "./page/ServiceIndex";
import { Statement } from "./page/Statement";
import { EmailPill } from "./ui/EmailPill";
import { Words } from "./Words";

/**
 * Web apps and Mobile apps. One continuous atmosphere from top to bottom: the room, then what we build
 * (the device stays while its screen changes), a walk along the design wall from idea to launch,
 * questions, and the sunrise.
 */
export function ServicePage({ kind }: { kind: "web" | "mobile" }) {
  const p = content.pages[kind];
  const { how, faq, studio } = content;
  const still = kind === "web" ? "s3" : "s4";
  return (
    <PageShell still={still} alt={kind === "web" ? "A web dashboard on a monitor in a warm studio at night" : "A phone lighting up on an oak table in a warm studio at night"} title={p.headline} intro={p.intro}>
      <Backdrop still={still} />
      <Statement text={p.statement} />
      <ServiceIndex kicker={p.index.kicker} items={p.index.items} />
      <Journey heading={how.heading} steps={how.steps} titles={how.walk} order={how.order} image="/worlds/wall-d.webp" aspect={3168 / 1344} at={[0.11, 0.355, 0.61, 0.855]} />

      {/* questions, in the warm light */}
      <section className="relative px-[var(--gutter)] py-28 md:py-40">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[85%] [background:radial-gradient(80%_60%_at_70%_0%,rgb(244_170_110/0.12),transparent_75%)]" />
        <InView className="relative grid gap-14 md:grid-cols-5 md:gap-[34px]" threshold={0.1}>
          <div className="md:sticky md:top-28 md:col-span-2 md:self-start">
            <h2 className="t-title"><Words text={faq.heading} /></h2>
            <p className="rise t-lead mt-4 max-w-[30ch]" style={{ ["--d" as string]: "300ms" }}>{faq.line} {studio.replyPromise}</p>
            <div className="rise mt-8" style={{ ["--d" as string]: "450ms" }}><EmailPill email={studio.email} /></div>
          </div>
          <div className="md:col-span-3"><Faq /></div>
        </InView>
      </section>

      <Finale />
    </PageShell>
  );
}
