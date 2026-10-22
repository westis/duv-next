"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useActiveSection } from "./sectionNavActive";

export interface SectionNavItem {
  /** A route ("/events/1/results") or a section on this page ("#results"). */
  href: string;
  label: string;
  /** Muted count after the label ("Results 128"). */
  count?: number | string;
}

export interface SectionNavProps {
  items: SectionNavItem[];
  /** Accessible name of the navigation ("Race sections"). */
  label: string;
  /**
   * "rail": the desktop contents list (small-caps heading, a rule on the left,
   * the active item marked red). "row": the phone jump row of text links.
   */
  variant?: "rail" | "row";
  /** Small-caps heading above the rail ("This race"). */
  heading?: ReactNode;
  /** Row only: stick to the top of the screen while the page scrolls. */
  sticky?: boolean;
  className?: string;
}

/**
 * A page's sections, Swiss Grid look: condensed capitals, the active item
 * marked with a red rule. A left list ("contents") on desktop and a
 * short jump row on phones, in place of tabs. Items can be routes (each section
 * its own page) or anchors on one long page (the active one follows the
 * scroll). Usually placed by `SectionLayout`, which shows both variants.
 */
export function SectionNav({ items, label, variant = "rail", heading, sticky = false, className }: SectionNavProps) {
  const active = useActiveSection(items.map((item) => item.href));
  const activeRef = useRef<HTMLAnchorElement>(null);
  const inPage = (href: string) => href.startsWith("#");

  useEffect(() => {
    if (variant === "row") activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active, variant]);

  if (variant === "rail") {
    return (
      <nav aria-label={label} className={cn("text-sm", className)}>
        {heading && <p className="label-caps border-b-[length:var(--rule-mid)] border-fg pb-2 text-fg">{heading}</p>}
        <ol className={cn("border-s border-border", heading && "mt-3")}>
          {items.map((item) => {
            const isActive = item.href === active;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? (inPage(item.href) ? "location" : "page") : undefined}
                  className={cn(
                    "nav-link -ms-px flex min-h-9 items-baseline gap-1.5 border-s-[length:var(--rule-mid)] py-1.5 ps-3.5 font-display text-base font-semibold tracking-[0.04em] uppercase hover:bg-transparent hover:underline",
                    isActive ? "border-brand text-fg" : "border-transparent text-fg-muted hover:text-fg"
                  )}
                >
                  {item.label}
                  {item.count !== undefined && (
                    <span className="font-sans text-xs font-normal tracking-normal text-fg-muted normal-case tabular">{item.count}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav
      aria-label={label}
      className={cn(sticky && "sticky top-[var(--header-h)] z-30 border-b border-border bg-bg", className)}
    >
      <ul className="-mx-4 flex gap-5 overflow-x-auto px-4 [scrollbar-width:none] md:-mx-6 md:px-6">
        {items.map((item) => {
          const isActive = item.href === active;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                ref={isActive ? activeRef : undefined}
                href={item.href}
                aria-current={isActive ? (inPage(item.href) ? "location" : "page") : undefined}
                className={cn(
                  "nav-link inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap font-display text-base font-semibold tracking-[0.04em] uppercase hover:bg-transparent",
                  isActive ? "text-fg shadow-[inset_0_calc(-1*var(--rule-mid))_0_var(--brand)]" : "text-fg-muted hover:text-fg"
                )}
              >
                {item.label}
                {item.count !== undefined && <span className="font-sans text-sm font-normal tracking-normal text-fg-muted normal-case tabular">{item.count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
