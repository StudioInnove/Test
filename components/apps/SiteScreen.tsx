"use client";

/*
 * The display in the websites room: one demo site that changes its look every few seconds, filling the
 * glass edge to edge (see SiteLooks).
 */
import { SiteLooks, SITE_LOOKS_SIZE } from "./SiteLooks";

export function SiteScreen() {
  return <SiteLooks />;
}

export const SITE_SIZE = SITE_LOOKS_SIZE;
