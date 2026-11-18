import type { ReactNode } from "react";

/** Text action led by a small outlined arrow capsule. */
export function Cap() {
  return (
    <span className="cap" aria-hidden>
      <svg width="9" height="7" viewBox="0 0 9 7"><path d="M0.5 3.5h7M5 1l2.5 2.5L5 6" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}

export function ArrowLink({ href, children, className = "", external = false }: { href: string; children: ReactNode; className?: string; external?: boolean }) {
  return (
    <a href={href} className={`link ${className}`} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
      <Cap />
      <span>{children}</span>
    </a>
  );
}
