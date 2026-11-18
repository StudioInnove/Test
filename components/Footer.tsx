import { asset, content, href } from "@/lib/content";
import { BookCall } from "./BookCall";

/** Asymmetric index: identity at left, numbered destinations stacked at right. */
export function Footer() {
  const { studio, footer, nav } = content;
  const groups = [
    { n: "1.0", label: "Studio", items: [...nav.links.map((l) => ({ label: l.label, href: href(l.href) })), { label: "Web apps", href: href("/web-app-development") }, { label: "Mobile apps", href: href("/mobile-app-development") }] },
    { n: "2.0", label: "Contact", items: [{ label: "Email", href: `mailto:${studio.email}` }, { label: "LinkedIn", href: studio.linkedin, ext: true }, { label: "YouTube", href: studio.youtube, ext: true }] },
  ];
  return (
    <footer className="bg-ink-2 px-[var(--gutter)] pb-8 pt-14">
      <div className="grid gap-16 md:grid-cols-5 md:gap-[34px]">
        <div className="flex flex-col justify-between gap-10 md:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/brand/logo.svg")} alt="Studio Innové" width={92} height={36} className="h-auto w-[92px]" />
          <div>
            <p className="t-body muted max-w-[28ch]">{footer.tagline}</p>
            <div className="mt-6"><BookCall size="sm">{content.close.cta}</BookCall></div>
          </div>
        </div>
        <div className="grid gap-12 sm:grid-cols-2 md:col-span-3 md:gap-[34px]">
          {groups.map((g) => (
            <div key={g.n}>
              <p className="index mb-5">{g.n}&nbsp;&nbsp;{g.label}</p>
              <ul className="space-y-1.5">
                {g.items.map((it) => (
                  <li key={it.label}>
                    <a href={it.href} className="link" {...("ext" in it && it.ext ? { target: "_blank", rel: "noopener" } : {})}><span className="t-head">{it.label}</span></a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-24 flex flex-wrap items-center justify-between gap-4 border-t-[0.5px] border-white/15 pt-6 t-small text-paper/40 md:ml-[calc(40%+14px)]">
        <span>© {studio.year} {studio.name}</span>
        <a href={href("/privacy")} className="link">{footer.privacy}</a>
        <span className="select-all">{studio.email}</span>
      </div>
    </footer>
  );
}
