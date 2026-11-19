"use client";

import { asset, content, href } from "@/lib/content";
import { BookCall } from "./BookCall";
import { CityWordmark } from "./ui/CityWordmark";

/**
 * The foot of the page: a short invitation, the links, a way back up — and the studio's name
 * set huge, lit like the city outside.
 */
export function Footer() {
  const { studio, footer, nav } = content;
  const groups = [
    { label: "Studio", items: nav.links.map((l) => ({ label: l.label, href: href(l.href) })) },
    { label: "Services", items: [{ label: "Web apps", href: href("/web-app-development") }, { label: "Mobile apps", href: href("/mobile-app-development") }, { label: "Studio Originals", href: href("/studio-originals") }] },
    { label: "Elsewhere", items: [{ label: "LinkedIn", href: studio.linkedin, ext: true }, { label: "YouTube", href: studio.youtube, ext: true }, { label: "Email", href: `mailto:${studio.email}` }] },
  ];

  const toTop = (e: React.MouseEvent) => {
    // on the home page the film flies you back to the start; elsewhere it's a link home
    if (document.querySelector("[data-scene]")) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("film:goto", { detail: 0 }));
    }
  };

  return (
    <footer className="relative overflow-hidden bg-ink-2 pt-20 md:pt-28">
      <div className="px-[var(--gutter)]">
        <div className="grid gap-14 md:grid-cols-12 md:gap-[34px]">
          <div className="md:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/brand/logo.svg")} alt={studio.name} width={64} height={25} className="h-auto w-[64px] opacity-90" />
            <p className="t-head mt-8 max-w-[22ch] text-paper/85">{footer.tagline}</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <BookCall className="!rounded-full !px-5">{nav.cta}</BookCall>
              <span className="t-small select-all text-paper/55">{studio.email}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-7 md:pl-10">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="t-small mb-4 text-paper/40">{g.label}</p>
                <ul className="space-y-2.5">
                  {g.items.map((it) => (
                    <li key={it.label}>
                      <a href={it.href} className="link text-[15px] text-paper/80 hover:text-paper" {...("ext" in it && it.ext ? { target: "_blank", rel: "noopener" } : {})}>
                        {it.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t-[0.5px] border-white/12 pt-5 text-[12px] text-paper/40">
          <span className="flex items-center gap-2.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal/60 [animation-duration:2.4s]" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
            </span>
            {footer.status}
          </span>
          <div className="flex items-center gap-6">
            <span>© {studio.year} {studio.name}</span>
            <a href={href("/privacy")} className="link text-[12px]">{footer.privacy}</a>
            <a href={href("/")} onClick={toTop} className="link group text-[12px] text-paper/60">
              {footer.top}
              <span aria-hidden className="inline-block transition-transform duration-300 [transition-timing-function:var(--ease-out)] group-hover:-translate-y-0.5">↑</span>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 [mask-image:linear-gradient(180deg,#000_45%,transparent_100%)]">
        <CityWordmark text={studio.name} />
      </div>
    </footer>
  );
}
