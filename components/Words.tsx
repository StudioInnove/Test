import type { ElementType } from "react";

/** Splits text into words that come in one by one from a soft blur (driven by an `on` class on a parent). */
export function Words({ text, as: Tag = "span", className = "", delay = 0 }: { text: string; as?: ElementType; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="w" style={{ ["--i" as string]: i, ["--d" as string]: `${delay}ms` }}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
