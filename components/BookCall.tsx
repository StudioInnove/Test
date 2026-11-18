"use client";

import { getCalApi } from "@calcom/embed-react";
import { useEffect, type ReactNode } from "react";
import { content } from "@/lib/content";

const NS = "call";
let ready: Promise<unknown> | null = null;

function initCal() {
  if (!ready) {
    ready = getCalApi({ namespace: NS }).then((cal) => {
      cal("ui", {
        theme: "dark",
        hideEventTypeDetails: false,
        layout: "month_view",
        cssVarsPerTheme: { dark: { "cal-brand": "#E8A15A" }, light: { "cal-brand": "#E8A15A" } },
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
  variant?: "amber" | "ghost";
  size?: "sm" | "md";
  arrow?: boolean;
  onOpen?: () => void;
};

/** Opens the calendar over the page. Without JavaScript it is a plain link to the booking page. */
export function BookCall({ children, className = "", variant = "amber", size = "md", arrow = true, onOpen }: Props) {
  const { calLink, calUrl } = content.studio;
  return (
    <a
      href={calUrl}
      target="_blank"
      rel="noopener"
      data-cal-namespace={NS}
      data-cal-link={calLink}
      data-cal-config='{"layout":"month_view","theme":"dark","overlayCalendar":"true"}'
      onPointerEnter={() => initCal()}
      onFocus={() => initCal()}
      onClick={(e) => {
        e.preventDefault();
        onOpen?.();
        initCal()
          .then((cal) => {
            (cal as (...a: unknown[]) => void)("modal", { calLink, config: { layout: "month_view", theme: "dark", overlayCalendar: "true" } });
          })
          .catch(() => window.open(calUrl, "_blank", "noopener"));
      }}
      className={`btn ${variant === "amber" ? "btn-amber" : "btn-ghost"} ${size === "sm" ? "btn-sm" : ""} ${className}`}
    >
      <span>{children}</span>
      {arrow && (
        <svg className="arrow" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2 7h9.5M7.5 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </a>
  );
}
