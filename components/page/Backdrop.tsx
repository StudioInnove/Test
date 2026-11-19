import { asset } from "@/lib/content";

/**
 * One continuous atmosphere behind a whole page (after Mont-fort's clouds): the room the page comes from,
 * softly out of focus and dimmed, fixed behind every section so the page never drops into flat panels.
 */
export function Backdrop({ still }: { still: string }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(`/film/stills/${still}-blur.webp`)} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-75" />
      <div className="absolute inset-0 [background:radial-gradient(90%_70%_at_50%_30%,rgb(7_10_18/0.2),rgb(7_10_18/0.72)_70%,rgb(7_10_18/0.92))]" />
    </div>
  );
}
