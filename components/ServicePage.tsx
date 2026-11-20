import { content } from "@/lib/content";
import { FaqDrum } from "./FaqDrum";
import { InView } from "./InView";
import { PageShell } from "./PageShell";
import { Haze } from "./page/Haze";
import { Handover } from "./page/Handover";
import { Finale } from "./page/Finale";
import { Journey } from "./page/Journey";
import { ServiceIndex } from "./page/ServiceIndex";
import { Statement } from "./page/Statement";
import { EmailPill } from "./ui/EmailPill";
import { Words } from "./Words";

/**
 * Web apps, Mobile apps and Websites. One continuous atmosphere from top to bottom: the room, then what we build
 * (the device stays while its screen changes), a walk along the design wall from idea to launch,
 * questions, and the sunrise.
 */
export function ServicePage({ kind }: { kind: "web" | "mobile" | "sites" }) {
  const p = content.pages[kind];
  const { how, faq, studio } = content;
  // websites: the design wall, until the room of their own is made
  const still = kind === "web" ? "s3" : kind === "mobile" ? "s4" : "s5";
  return (
    <PageShell still={still} alt={kind === "web" ? "A web dashboard on a monitor in a warm studio at night" : kind === "mobile" ? "A phone lighting up on an oak table in a warm studio at night" : "Sketches for every page pinned along a walnut wall in the studio at night"} title={p.headline} intro={p.intro}>
      <Haze />
      <Statement text={p.statement} />
      <Handover />
      <ServiceIndex kicker={p.index.kicker} items={p.index.items} />
      <Handover />
      <Journey heading={how.heading} steps={how.steps} titles={how.walk} order={how.order} image="/worlds/wall-d.webp" aspect={3168 / 1344} at={[0.11, 0.355, 0.61, 0.855]} />

      {/* questions, as a conversation */}
      <Handover />
      <FaqDrum />

      <Finale />
    </PageShell>
  );
}
