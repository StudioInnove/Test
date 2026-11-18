"use client";

import Link from "next/link";
import { useRef } from "react";
import { content } from "@/lib/content";
import { BookCall } from "./BookCall";

/** Closing footer: a slow beam of light and a cursor glow pass behind a giant wordmark. */
export function Footer() {
  const { studio, footer, nav } = content;
  const ref = useRef<HTMLElement>(null);
  return (
    <footer
      ref={ref}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`);
        ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className="relative isolate overflow-hidden bg-ink pt-24"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(600px_circle_at_var(--mx,70%)_var(--my,30%),rgb(232_161_90/0.10),transparent_60%)]" />
      <div aria-hidden className="beam pointer-events-none absolute -top-1/2 left-[-20%] -z-10 h-[200%] w-[38%] rotate-[24deg] bg-gradient-to-r from-transparent via-amber/[0.07] to-transparent blur-2xl" />
      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 sm:px-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="max-w-[22ch] text-[22px] font-medium leading-snug tracking-[-0.015em] text-paper">{footer.tagline}</p>
          <div className="mt-7">
            <BookCall>{content.close.cta}</BookCall>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-4">Studio</p>
          <ul className="space-y-2.5 text-[15px] text-paper/75">
            {nav.links.map((l) => (
              <li key={l.href}><a href={l.href} className="transition-colors hover:text-paper">{l.label}</a></li>
            ))}
            <li><Link href="/web-app-development" className="transition-colors hover:text-paper">Web app development</Link></li>
            <li><Link href="/mobile-app-development" className="transition-colors hover:text-paper">Mobile app development</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">Contact</p>
          <ul className="space-y-2.5 text-[15px] text-paper/75">
            <li><a href={`mailto:${studio.email}`} className="break-all transition-colors hover:text-paper">{studio.email}</a></li>
            <li><a href={studio.linkedin} target="_blank" rel="noopener" className="transition-colors hover:text-paper">LinkedIn</a></li>
            <li><a href={studio.youtube} target="_blank" rel="noopener" className="transition-colors hover:text-paper">YouTube</a></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-20 flex max-w-[1200px] flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-6 text-[13px] text-paper/45 sm:px-10">
        <span>© {studio.year} {studio.name}</span>
        <Link href="/privacy" className="transition-colors hover:text-paper">{footer.privacy}</Link>
      </div>

      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <p className="translate-y-[22%] whitespace-nowrap text-center text-[19.5vw] font-semibold leading-[0.8] tracking-[-0.06em] text-transparent [background:linear-gradient(180deg,rgb(242_241_238/0.16),rgb(242_241_238/0.02)_75%)] [-webkit-background-clip:text] [background-clip:text]">
          Studio Innové
        </p>
      </div>
      <style>{`
        @keyframes beam { 0% { transform: translateX(0) rotate(24deg); } 100% { transform: translateX(380%) rotate(24deg); } }
        .beam { animation: beam 14s cubic-bezier(0.77,0,0.175,1) infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .beam { animation: none; } }
      `}</style>
    </footer>
  );
}
