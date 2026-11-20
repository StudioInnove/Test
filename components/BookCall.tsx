"use client";

import { getCalApi } from "@calcom/embed-react";
import { useEffect, type ReactNode } from "react";
import { content } from "@/lib/content";

const NS = "call";
let ready: Promise<unknown> | null = null;
/** True once the calendar pop-up has loaded; until then the button is a plain link to the booking page. */
let calReady = false;

function initCal() {
  if (!ready) {
    ready = getCalApi({ namespace: NS }).then((cal) => {
      calReady = true;
      cal("ui", {
        theme: "dark",
        hideEventTypeDetails: false,
        layout: "month_view",
        cssVarsPerTheme: { dark: { "cal-brand": "#efe9e0" }, light: { "cal-brand": "#070a12" } },
      });
      return cal;
    });
  }
  return ready;
}

/** Warms up the booking calendar after the page is idle, so it opens instantly. */
export function CalWarmup() {
  useEffect(() => {
    const id = window.setTimeout(() => initCal(), 2500);
    return () => clearTimeout(id);
  }, []);
  return null;
}

type Props = {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "ghost";
  size?: "sm" | "md";
  arrow?: boolean;
  onOpen?: () => void;
};

/** Opens the calendar pop-up, or the booking page in a new tab if the pop-up hasn't loaded. */
export function openCal() {
  const { calLink, calUrl } = content.studio;
  if (!calReady) {
    initCal();
    window.open(calUrl, "_blank", "noopener");
    return;
  }
  initCal().then((cal) => {
    (cal as (...a: unknown[]) => void)("modal", { calLink, config: { layout: "month_view", theme: "dark", overlayCalendar: "true" } });
  });
}

/** Opens the contact panel (a call, or a few lines about the idea). Without JavaScript it is a plain link to the booking page. */
export function BookCall({ children, className = "", variant = "primary", size = "md", arrow = false, onOpen }: Props) {
  const { calUrl } = content.studio;
  return (
    <a
      href={calUrl}
      target="_blank"
      rel="noopener"
      onPointerEnter={() => initCal()}
      onFocus={() => initCal()}
      onClick={(e) => {
        onOpen?.();
        e.preventDefault();
        initCal();
        window.dispatchEvent(new CustomEvent("contact:open"));
      }}
      className={`btn ${variant === "primary" ? "btn-primary" : "btn-ghost"} ${size === "sm" ? "btn-sm" : ""} ${className}`}
    >
      <span>{children}</span>
      {arrow && (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 6h7.5M6.5 3l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </a>
  );
}
