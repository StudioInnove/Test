import type { MetadataRoute } from "next";
export const dynamic = "force-static";
import { SITE_URL } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["", "/web-app-development", "/mobile-app-development", "/process", "/studio-originals", "/privacy"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p === "/privacy" ? 0.2 : 0.8,
  }));
}
