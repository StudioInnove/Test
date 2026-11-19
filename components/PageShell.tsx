import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { InView } from "./InView";
import { Words } from "./Words";
import { asset } from "@/lib/content";

/** Pages beyond the film: a full-screen still from it that settles in slowly, then the story. */
export function PageShell({ still, alt, eyebrow, title, intro, children }: { still: string; alt: string; eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main>
      <Nav />
      <header className="relative flex min-h-[100svh] items-end overflow-hidden bg-ink">
        <picture>
          <source media="(max-width: 899px)" srcSet={asset(`/film/stills/${still}-m.webp`)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(`/film/stills/${still}-d.webp`)} alt={alt} fetchPriority="high" className="page-still absolute inset-0 h-full w-full object-cover" />
        </picture>
        <div aria-hidden className="absolute inset-0 [background:linear-gradient(0deg,#070a12_0%,rgb(7_10_18/0.6)_36%,rgb(7_10_18/0.1)_70%)]" />
        <InView className="relative w-full px-[var(--gutter)] pb-[10svh]" threshold={0}>
          <p className="rise mb-6 text-[13px] text-paper/55">{eyebrow}</p>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
            <h1 className="max-w-[12ch] text-[clamp(48px,7.4vw,128px)] font-[320] leading-[0.94] tracking-[-0.045em] [text-wrap:balance]"><Words text={title} delay={150} /></h1>
            <p className="rise max-w-[36ch] text-[17px] leading-[1.5] tracking-[-0.01em] text-paper/75 md:pb-[0.5vw]" style={{ ["--d" as string]: "700ms" }}>{intro}</p>
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
        {title ? <h2 className="text-[clamp(36px,4.4vw,64px)] font-[320] leading-none tracking-[-0.04em] md:col-span-2"><Words text={title} /></h2> : <div className="hidden md:col-span-2 md:block" />}
        <div className="md:col-span-3">{children}</div>
      </InView>
    </section>
  );
}
