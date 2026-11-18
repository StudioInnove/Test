import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { asset } from "@/lib/content";

/** Light, fast pages: one still from the film, then plain readable sections. */
export function PageShell({ still, alt, eyebrow, title, intro, children }: { still: string; alt: string; eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main className="grain">
      <Nav />
      <header className="relative flex min-h-[78svh] items-end overflow-hidden">
        <picture>
          <source media="(max-width: 899px)" srcSet={asset(`/film/stills/${still}-m.webp`)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(`/film/stills/${still}-d.webp`)} alt={alt} fetchPriority="high" className="absolute inset-0 h-full w-full scale-[1.02] object-cover" />
        </picture>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
        <div className="relative mx-auto w-full max-w-[1200px] px-6 pb-16 sm:px-10 md:pb-20">
          <p className="eyebrow mb-5 text-paper/70">{eyebrow}</p>
          <h1 className="display max-w-[14ch] text-[clamp(44px,6.4vw,100px)]">{title}</h1>
          <p className="lede mt-6 max-w-[44ch] text-[clamp(18px,1.5vw,21px)] leading-relaxed">{intro}</p>
        </div>
      </header>
      {children}
      <Footer />
    </main>
  );
}

export function Section({ eyebrow, title, children, id }: { eyebrow?: string; title?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="bg-ink px-6 py-20 sm:px-10 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        {title && <h2 className="display mb-12 text-[clamp(34px,4vw,60px)]">{title}</h2>}
        {children}
      </div>
    </section>
  );
}
