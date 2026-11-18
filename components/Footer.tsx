import { asset, content, href } from "@/lib/content";

/** Quiet index footer: small identity left, two short link groups right, a thin legal line. */
export function Footer() {
  const { studio, footer, nav } = content;
  const groups = [
    { label: "Studio", items: [...nav.links.map((l) => ({ label: l.label, href: href(l.href) })), { label: "Web apps", href: href("/web-app-development") }, { label: "Mobile apps", href: href("/mobile-app-development") }] },
    { label: "Contact", items: [{ label: "Email", href: `mailto:${studio.email}` }, { label: "Book a call", href: studio.calUrl, ext: true }, { label: "LinkedIn", href: studio.linkedin, ext: true }, { label: "YouTube", href: studio.youtube, ext: true }] },
  ];
  return (
    <footer className="bg-ink-2 px-[var(--gutter)] pb-7 pt-16">
      <div className="grid gap-12 md:grid-cols-5 md:gap-[34px]">
        <div className="md:col-span-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/brand/logo.svg")} alt="Studio Innové" width={56} height={22} className="h-auto w-[56px] opacity-90" />
          <p className="t-small mt-5 max-w-[30ch] text-paper/55">{footer.tagline}</p>
        </div>
        {groups.map((g) => (
          <div key={g.label}>
            <p className="t-small mb-4 text-paper/40">{g.label}</p>
            <ul className="space-y-2">
              {g.items.map((it) => (
                <li key={it.label}>
                  <a href={it.href} className="link text-[14px] text-paper/80 hover:text-paper" {...("ext" in it && it.ext ? { target: "_blank", rel: "noopener" } : {})}>{it.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t-[0.5px] border-white/12 pt-5 text-[12px] text-paper/40">
        <span>© {studio.year} {studio.name}</span>
        <div className="flex items-center gap-5">
          <a href={href("/privacy")} className="link text-[12px]">{footer.privacy}</a>
          <span className="select-all">{studio.email}</span>
        </div>
      </div>
    </footer>
  );
}
