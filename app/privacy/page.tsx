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
        <p className="index mb-5">Updated {p.updated}</p>
        <h1 className="t-display mb-12">{p.title}</h1>
        <div className="t-body space-y-6 text-paper/70">
          {p.body.map((b, i) => {
            const [head, ...rest] = b.split(". ");
            return i === 0 ? <p key={i}>{b}</p> : (
              <p key={i}><strong className="font-[450] text-paper">{head}.</strong> {rest.join(". ")}</p>
            );
          })}
        </div>
      </article>
      <Footer />
    </main>
  );
}
