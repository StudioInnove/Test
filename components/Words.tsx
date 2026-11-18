import type { ElementType } from "react";

/**
 * Splits text into words that come in one by one from a soft blur (driven by an `on` class on a parent).
 * Wrap a word in *asterisks* to set it in the italic serif accent.
 */
export function Words({ text, as: Tag = "span", className = "", delay = 0 }: { text: string; as?: ElementType; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <Tag className={className} aria-label={text.replace(/\*/g, "")}>
      {words.map((raw, i) => {
        const accent = /^\*.*\*[.,!?]?$/.test(raw);
        const w = raw.replace(/\*/g, "");
        return (
          <span key={i} aria-hidden className={`w${accent ? " accent" : ""}`} style={{ ["--i" as string]: i, ["--d" as string]: `${delay}ms` }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </Tag>
  );
}
