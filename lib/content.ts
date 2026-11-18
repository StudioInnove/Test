import site from "@/content/site.json";

export type Site = typeof site;
export const content: Site = site;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "https://studio-innove.vercel.app"
).replace(/\/$/, "");
