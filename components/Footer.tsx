"use client";

/*
 * A compact footer over a field of tiny warm lights, like the city at night seen from very high up.
 * The studio's name isn't drawn: it is the gap in the lights. On a computer the lights brighten
 * around the cursor. The field drifts slowly.
 * Adapted from the 21st.dev "Dithered Footer" (otatechie), set in our palette and made quieter.
 */
import { useRef, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { asset, content, href } from "@/lib/content";

// Stochastic dither: noise thresholded to on/off, sparse at the top and dense at the bottom.
const DITHER =
  "url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27360%27%20height%3D%27240%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%270%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270.04%27%20stop-color%3D%27%23000%27%2F%3E%3Cstop%20offset%3D%270.96%27%20stop-color%3D%27%23fff%27%2F%3E%3C%2FlinearGradient%3E%3Cfilter%20id%3D%27f%27%20x%3D%270%27%20y%3D%270%27%20width%3D%27100%25%27%20height%3D%27100%25%27%20color-interpolation-filters%3D%27sRGB%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.45%27%20numOctaves%3D%272%27%20seed%3D%277%27%20stitchTiles%3D%27stitch%27%20result%3D%27n%27%2F%3E%3CfeColorMatrix%20in%3D%27n%27%20type%3D%27matrix%27%20values%3D%271%200%200%200%200%201%200%200%200%200%201%200%200%200%200%200%200%200%200%201%27%20result%3D%27ng%27%2F%3E%3CfeComposite%20in%3D%27SourceGraphic%27%20in2%3D%27ng%27%20operator%3D%27arithmetic%27%20k2%3D%270.5%27%20k3%3D%270.5%27%20result%3D%27s%27%2F%3E%3CfeComponentTransfer%20in%3D%27s%27%20result%3D%27t%27%3E%3CfeFuncR%20type%3D%27discrete%27%20tableValues%3D%270%201%27%2F%3E%3C%2FfeComponentTransfer%3E%3CfeColorMatrix%20in%3D%27t%27%20type%3D%27matrix%27%20values%3D%270%200%200%200%201%200%200%200%200%200.5%200%200%200%200%200%201%200%200%200%200%27%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20fill%3D%27url%28%23g%29%27%20filter%3D%27url%28%23f%29%27%2F%3E%3C%2Fsvg%3E')";
const GRID = "radial-gradient(circle, #000 0.85px, transparent 1.25px)";

const STYLES = `
.lf-field { position: absolute; inset: 0; transition: opacity 600ms ease; }
.lf-field.lf-lit {
  -webkit-mask-image: radial-gradient(circle 200px at var(--lf-x, 50%) var(--lf-y, 50%), #000 30%, rgb(0 0 0 / .45) 100%);
  mask-image: radial-gradient(circle 200px at var(--lf-x, 50%) var(--lf-y, 50%), #000 30%, rgb(0 0 0 / .45) 100%);
}
.lf-dots {
  position: absolute; top: 0; bottom: 0; left: 0; width: calc(100% + 360px);
  background: linear-gradient(90deg, rgb(232 161 90 / .5), rgb(239 233 224 / .32) 50%, rgb(232 161 90 / .5));
  -webkit-mask-image: ${GRID}, ${DITHER}; mask-image: ${GRID}, ${DITHER};
  -webkit-mask-size: 4px 4px, 360px 240px; mask-size: 4px 4px, 360px 240px;
  -webkit-mask-repeat: repeat, repeat-x; mask-repeat: repeat, repeat-x;
  -webkit-mask-position: 0 0, left bottom; mask-position: 0 0, left bottom;
  -webkit-mask-composite: source-in; mask-composite: intersect;
}
.lf-glow { position: absolute; inset: 0; opacity: 0; transition: opacity 500ms ease;
  background: radial-gradient(circle 160px at var(--lf-x, 50%) var(--lf-y, 50%), rgb(232 161 90 / .9), transparent 70%);
  -webkit-mask-image: ${GRID}; mask-image: ${GRID}; -webkit-mask-size: 4px 4px; mask-size: 4px 4px; }
.lf-lit ~ .lf-glow, .lf-band:hover .lf-glow { opacity: .55; }
@media (prefers-reduced-motion: no-preference) {
  .lf-dots { animation: lf-drift 60s linear infinite; }
}
@keyframes lf-drift { to { translate: -360px 0; } }
`;

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="currentColor" aria-hidden><path d={d} /></svg>
);
const LINKEDIN = "M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z";
const YOUTUBE = "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6z";

export function Footer() {
  const { studio, footer, nav } = content;
  const field = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const links = [
    ...nav.links.map((l) => ({ label: l.label, href: href(l.href) })),
    { label: "Web apps", href: href("/web-app-development") },
    { label: "Mobile apps", href: href("/mobile-app-development") },
  ];

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !field.current) return;
    const el = field.current;
    const band = el.parentElement!;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      band.style.setProperty("--lf-x", `${x}px`);
      band.style.setProperty("--lf-y", `${y}px`);
      el.classList.add("lf-lit");
    });
  };
  const onLeave = () => {
    cancelAnimationFrame(frame.current);
    field.current?.classList.remove("lf-lit");
  };

  const toTop = (e: MouseEvent) => {
    // on the home page the film flies you back to the start; elsewhere it's a link home
    if (document.querySelector("[data-scene]")) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("film:goto", { detail: 0 }));
    }
  };

  return (
    <footer className="relative overflow-hidden bg-ink-2" style={{ "--lf-bg": "#0a0e19" } as CSSProperties}>
      <style>{STYLES}</style>

      <div className="flex flex-col gap-10 border-t-[0.5px] border-white/10 px-[var(--gutter)] pb-10 pt-14 md:flex-row md:items-start md:justify-between md:pt-16">
        <div className="max-w-[300px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/brand/logo.svg")} alt={studio.name} width={64} height={25} className="h-auto w-[60px] opacity-90" />
          <p className="t-small mt-4 text-[14px] leading-relaxed text-paper/50">{footer.tagline}</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2.5 sm:grid-cols-3 md:gap-x-14">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-[14px] text-paper/60 transition-colors duration-300 hover:text-paper">
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      {/* the lights, with the name cut out of them */}
      <div aria-hidden className="lf-band relative h-[clamp(72px,12vw,176px)] overflow-hidden" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div ref={field} className="lf-field">
          <div className="lf-dots" />
        </div>
        <div className="lf-glow" />
        <p className="pointer-events-none absolute -bottom-[0.06em] left-[calc(var(--gutter)-0.06em)] select-none whitespace-nowrap text-[clamp(60px,15.6vw,250px)] font-[600] leading-[0.8] tracking-[-0.055em] text-[var(--lf-bg)]">
          {studio.name}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-[var(--gutter)] py-5 text-[12px] text-paper/40">
        <div className="flex items-center gap-5">
          <span>© {studio.year} {studio.name}</span>
          <a href={href("/privacy")} className="transition-colors hover:text-paper">{footer.privacy}</a>
        </div>
        <div className="flex items-center gap-1">
          <a href={studio.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn" className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/[0.06] hover:text-paper"><Icon d={LINKEDIN} /></a>
          <a href={studio.youtube} target="_blank" rel="noopener" aria-label="YouTube" className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/[0.06] hover:text-paper"><Icon d={YOUTUBE} /></a>
          <span aria-hidden className="mx-2 h-3.5 w-px bg-white/12" />
          <a href={href("/")} onClick={toTop} className="group inline-flex items-center gap-1.5 transition-colors hover:text-paper">
            {footer.top}
            <svg viewBox="0 0 24 24" className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
