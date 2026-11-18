import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy — Studio Innové",
  description: "What Studio Innové collects, why, and how to be removed.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  const p = content.privacyPage;
  return (
    <main>
      <Nav />
      <article className="mx-auto max-w-[720px] px-6 pb-28 pt-40">
        <p className="eyebrow mb-4">Updated {p.updated}</p>
        <h1 className="display mb-12 text-[clamp(44px,6vw,80px)]">{p.title}</h1>
        <div className="space-y-6 text-[17px] leading-relaxed text-paper/75">
          {p.body.map((b, i) => {
            const [head, ...rest] = b.split(". ");
            return i === 0 ? <p key={i}>{b}</p> : (
              <p key={i}><strong className="font-semibold text-paper">{head}.</strong> {rest.join(". ")}</p>
            );
          })}
        </div>
      </article>
      <Footer />
    </main>
  );
}
