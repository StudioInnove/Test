import site from "@/content/site.json";

export type Site = typeof site;
export const content: Site = site;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "https://studio-innove.vercel.app"
).replace(/\/$/, "");

/** Prefix for files in /public. "/" on the live site; "./" in the self-contained preview. */
export const BASE = process.env.NEXT_PUBLIC_BASE || "/";
/** In the preview, pages one folder down set window.__B = "../" so files still resolve. */
const base = () => (typeof window !== "undefined" && (window as unknown as { __B?: string }).__B) || BASE;
export const asset = (path: string) => base() + path.replace(/^\//, "");

/** Internal links: absolute on the live site, relative in the preview. */
export const href = (h: string) => {
  if (BASE === "/") return h;
  if (h === "/") return "./";
  if (h.startsWith("/#")) return h.slice(1);
  return h.replace(/^\//, "") + (h.includes("#") ? "" : "/");
};
