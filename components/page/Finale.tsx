import { content } from "@/lib/content";
import { BookCall } from "../BookCall";
import { InView } from "../InView";
import { LivingStill } from "../LivingStill";
import { Words } from "../Words";

/** Every page ends the way the site's story does: the city at sunrise, and an open door. */
export function Finale() {
  const { close, studio } = content;
  return (
    <section className="relative flex h-[100svh] min-h-[560px] items-center justify-center overflow-hidden">
      <LivingStill still="s1d" alt="The city at sunrise, seen from the studio" />
      <div aria-hidden className="absolute inset-0 [background:radial-gradient(60%_55%_at_50%_50%,rgb(20_14_10/0.62),rgb(20_14_10/0.2)_70%,transparent),linear-gradient(0deg,#070a12_0%,transparent_22%)]" />
      <InView threshold={0.3} className="stack center relative px-[var(--gutter)]">
        <h2 className="t-display"><Words text={close.heading} /></h2>
        <p className="rise t-lead max-w-[34ch] !text-paper/85" style={{ ["--d" as string]: "250ms" }}>{close.line}</p>
        <div className="rise actions" style={{ ["--d" as string]: "380ms" }}>
          <BookCall>{close.cta}</BookCall>
          <a href={`mailto:${studio.email}`} className="more">{close.email}</a>
        </div>
      </InView>
    </section>
  );
}
