import { content } from "@/lib/content";
import { FaqDrum } from "./FaqDrum";
import { InView } from "./InView";
import { PageShell } from "./PageShell";
import { Haze } from "./page/Haze";
import { Handover } from "./page/Handover";
import { Finale } from "./page/Finale";
import { ServiceIndex } from "./page/ServiceIndex";
import { TryIt } from "./page/TryIt";
import { Statement } from "./page/Statement";
import { EmailPill } from "./ui/EmailPill";
import { Words } from "./Words";

/**
 * Web apps, Mobile apps and Websites. One continuous atmosphere from top to bottom: the room, then what we build
 * (the device stays while its screen changes), the demo made in that room to try for yourself,
 * questions, and the sunrise.
 */
export function ServicePage({ kind }: { kind: "web" | "mobile" | "sites" }) {
  const p = content.pages[kind];
  const still = kind === "web" ? "s3" : kind === "mobile" ? "s4" : "s7";
  return (
    <PageShell still={still} alt={kind === "web" ? "A web dashboard on a monitor in a warm studio at night" : kind === "mobile" ? "A phone lighting up on an oak table in a warm studio at night" : "A website being designed on a wide display beside a pinboard of page layouts, in a warm studio at night"} title={p.headline} intro={p.intro}>
      <Haze />
      <Statement text={p.statement} />
      <Handover />
      <ServiceIndex kicker={p.index.kicker} items={p.index.items} />
      <Handover />
      {/* made here: the demo itself, working */}
      <TryIt kind={kind} copy={p.tryit} />

      {/* questions, as a conversation */}
      <Handover />
      <FaqDrum set={kind} />

      <Finale />
    </PageShell>
  );
}
