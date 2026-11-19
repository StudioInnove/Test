import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { Backdrop } from "@/components/page/Backdrop";
import { Finale } from "@/components/page/Finale";
import { Journey } from "@/components/page/Journey";
import { Statement } from "@/components/page/Statement";
import { content } from "@/lib/content";

const p = content.pages.process;
export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: "/process" },
  openGraph: { title: p.metaTitle, description: p.metaDescription, url: "/process", images: ["/og.jpg"] },
};

/** How we work: a walk along the design wall, step by step, then the sunrise. */
export default function Page() {
  return (
    <PageShell still="s5" alt="A wall of sketches and screens in a warm studio at night" title={p.headline} intro={p.intro}>
      <Backdrop still="s5" />
      <Statement text={p.statement} />
      <Journey heading={content.how.heading} steps={p.steps} image="/worlds/wall-d.webp" aspect={3168 / 1344} at={[0.11, 0.355, 0.61, 0.855]} />
      <Finale />
    </PageShell>
  );
}
