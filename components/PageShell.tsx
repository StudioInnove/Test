import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { InView } from "./InView";
import { Words } from "./Words";
import { MaskText } from "./ui/MaskText";
import { content, href } from "@/lib/content";
import { LivingStill } from "./LivingStill";
import type { StillId } from "./film/timeline";
import { SmoothScroll } from "./ui/SmoothScroll";
import { HeroScroll } from "./page/HeroScroll";

/** Pages beyond the film: a full-screen still from it that settles in slowly, then the story. */
export function PageShell({ still, alt, title, intro, children }: { still: StillId; alt: string; eyebrow?: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main className="relative isolate">
      <SmoothScroll />
      <Nav />
      <header data-hero className="relative flex min-h-[100svh] items-end overflow-hidden">
        <HeroScroll />
        <div data-hero-media className="absolute inset-0 overflow-hidden bg-ink will-change-transform">
          <LivingStill still={still} alt={alt} />
        </div>
        {/* back to the film, from any page */}
        <a href={href("/")} className="more world-back absolute left-[var(--gutter)] top-6 z-10 hidden h-11 md:inline-flex">{content.worlds.backHome}</a>
        <div aria-hidden className="pointer-events-none absolute inset-0 [background:linear-gradient(0deg,rgb(7_10_18/0.85)_0%,rgb(7_10_18/0.45)_36%,transparent_70%)]" />
        <InView className="relative w-full px-[var(--gutter)] pb-[10svh]" threshold={0}>
          <div data-hero-words>
          <div className="stack max-w-[680px]">
            <MaskText as="h1" className="scene-title" text={title} delay={300} />
            <p className="rise t-lead max-w-[40ch]" style={{ ["--d" as string]: "500ms" }}>{intro}</p>
          </div>
          </div>
        </InView>
      </header>
      {children}
      <Footer />
    </main>
  );
}

export function Section({ title, children, id, tone = "ink" }: { title?: string; children: ReactNode; id?: string; tone?: "ink" | "ink-2" }) {
  return (
    <section id={id} className={`${tone === "ink" ? "bg-ink" : "bg-ink-2"} px-[var(--gutter)] py-24 md:py-36`}>
      <InView className="grid gap-12 md:grid-cols-5 md:gap-[34px]" threshold={0.1}>
        {title ? <h2 className="t-title md:col-span-2"><Words text={title} /></h2> : <div className="hidden md:col-span-2 md:block" />}
        <div className="md:col-span-3">{children}</div>
      </InView>
    </section>
  );
}
