"use client";

/*
 * The display in the websites room: the studio's sites, live in a browser window, filling the glass edge to
 * edge (see LiveSites).
 */
import { LiveSites, LIVE_SITES_SIZE } from "./LiveSites";

export function SiteScreen() {
  return <LiveSites />;
}

export const SITE_SIZE = LIVE_SITES_SIZE;
