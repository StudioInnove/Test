"use client";

/*
 * A compact footer over a field of tiny warm lights, like the city at night seen from very high up.
 * The studio's name isn't drawn: it is the gap in the lights. Windows flicker now and then, a train passes.
 * The idea of a name cut out of lights comes from the 21st.dev "Dithered Footer" (otatechie).
 * As you reach it, the footer rises out from under the page above (GSAP ScrollTrigger, scrubbed), and
 * its links arrive one after another.
 */
import { useEffect, useRef, type MouseEvent } from "react";
import { getGsap } from "@/lib/gsap";
import { CityLights } from "./ui/CityLights";
import { asset, content, href } from "@/lib/content";

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="currentColor" aria-hidden><path d={d} /></svg>
);
const LINKEDIN = "M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z";
const YOUTUBE = "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6z";

export function Footer() {
  const { studio, footer, nav } = content;

  const links = [
    ...nav.links.map((l) => ({ label: l.label, href: href(l.href) })),
    { label: "Web apps", href: href("/web-app-development") },
    { label: "Mobile apps", href: href("/mobile-app-development") },
    { label: "Websites", href: href("/website-design") },
    { label: "How we work", href: href("/#how") },
  ];

  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { gsap } = getGsap();
    const inner = el.querySelector("[data-foot-inner]");
    const ctx = gsap.context(() => {
      // it sits a little lower and darker, as if underneath the page, and rises into place as you arrive
      gsap.fromTo(inner, { yPercent: -18, opacity: 0.35 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom bottom", scrub: 0.6 } });
      gsap.from(el.querySelectorAll("[data-foot-item]"), {
        y: 14, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.05,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const toTop = (e: MouseEvent) => {
    // on the home page the film flies you back to the start; elsewhere it's a link home
    if (document.querySelector("[data-scene]")) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("film:goto", { detail: 0 }));
    }
  };

  return (
    <footer ref={ref} className="relative overflow-hidden bg-ink-2">
      <div data-foot-inner className="will-change-transform">

      <div className="flex flex-col gap-10 border-t-[0.5px] border-white/10 px-[var(--gutter)] pb-10 pt-14 md:flex-row md:items-start md:justify-between md:pt-16">
        <div className="max-w-[300px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img data-foot-item src={asset("/brand/logo.svg")} alt={studio.name} width={64} height={25} className="h-auto w-[58px] opacity-90" />
          <p data-foot-item className="t-body mt-4">{footer.tagline}</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2.5 sm:grid-cols-3 md:gap-x-14">
          {links.map((l) => (
            <a key={l.label} data-foot-item href={l.href} className="foot-link text-[14px] text-paper/70 transition-colors duration-300 hover:text-paper">
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      {/* the lights, with the name cut out of them */}
      <CityLights text={studio.name} />

      <div className="flex items-center justify-between gap-4 whitespace-nowrap px-[var(--gutter)] py-5 text-[13px] text-paper/40">
        <span>© {studio.year}<span className="max-sm:hidden"> {studio.name}</span></span>
        <div className="flex items-center gap-4 sm:gap-6">
          <a href={href("/privacy")} className="transition-colors hover:text-paper">{footer.privacy}</a>
          <a href={studio.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn" className="transition-colors hover:text-paper"><Icon d={LINKEDIN} /></a>
          <a href={studio.youtube} target="_blank" rel="noopener" aria-label="YouTube" className="transition-colors hover:text-paper"><Icon d={YOUTUBE} /></a>
          <a href={href("/")} onClick={toTop} aria-label={footer.top} className="group inline-flex items-center gap-1.5 transition-colors hover:text-paper">
            <span className="max-sm:hidden">{footer.top}</span>
            <span aria-hidden className="relative inline-block">
              {/* a fine line draws up from the arrow, towards the top of the page */}
              <span className="absolute bottom-[9px] left-1/2 h-4 w-px origin-bottom -translate-x-1/2 scale-y-0 bg-current transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:scale-y-100" />
            <svg viewBox="0 0 24 24" className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
            </span>
          </a>
        </div>
      </div>
      </div>
    </footer>
  );
}
