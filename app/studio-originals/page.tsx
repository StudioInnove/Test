import type { Metadata } from "next";
import { CloseUp } from "@/components/CloseUp";
import { PageShell } from "@/components/PageShell";
import { Haze } from "@/components/page/Haze";
import { Finale } from "@/components/page/Finale";
import { LaunchTrack, WaitlistForm } from "@/components/Originals";
import { Words } from "@/components/Words";
import { content } from "@/lib/content";

const p = content.pages.originalsPage;
export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: "/studio-originals" },
  openGraph: { title: p.metaTitle, description: p.metaDescription, url: "/studio-originals", images: ["/og.jpg"] },
};
const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` });

/** Studio Originals: the back room, then the screen up close, with where the build is and the list. */
export default function Page() {
  const o = content.originals;
  const w = content.worlds.originals;
  const rv = o.reveal;
  return (
    <PageShell still="s6" alt="A row of screens in a quiet room, one glowing amber" title={rv.on ? `Meet *${rv.name}.*` : o.heading} intro={rv.on ? rv.line : o.line}>
      <Haze />
      <CloseUp id="originals">
        {rv.on ? (
          <>
            <h2 className="t-title"><Words text={`Meet *${rv.name}.*`} /></h2>
            <p className="rise t-lead" style={d(250)}>{rv.line}</p>
            <div className="rise actions mt-8" style={d(380)}><a href={rv.url} target="_blank" rel="noopener" className="btn btn-primary">{rv.cta}</a></div>
          </>
        ) : (
          <>
            <h2 className="t-title"><Words text={w.title} /></h2>
            <p className="rise t-lead" style={d(250)}>{w.line}</p>
            <div className="rise mt-8 w-full" style={d(380)}><LaunchTrack scrub /></div>
            <div className="rise mt-8 w-full" style={d(500)}><WaitlistForm source="originals-page" /></div>
          </>
        )}
      </CloseUp>
      <Finale />
    </PageShell>
  );
}
