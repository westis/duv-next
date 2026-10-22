"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  href: string;
  label: string;
  /** Muted count after the label ("Results 213"). */
  count?: number | string;
}

/**
 * A row of section links where every item is its own route, Swiss Grid look:
 * condensed capitals, the active one with a 3 px red underline, a hairline below.
 * Sticky under the site header; scrolls sideways on phones and keeps the
 * active item in view. Pages with a few big sections should prefer
 * `SectionLayout` (a left contents rail on desktop, this kind of row on phones).
 */
export function TabNav({ items, label, className }: { items: TabItem[]; label: string; className?: string }) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);
  // The longest matching href wins, so /events/1 is not active on /events/1/results.
  const active = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <nav
      aria-label={label}
      className={cn("sticky top-[var(--header-h)] z-30 -mx-4 border-b border-border bg-bg md:-mx-6 lg:-mx-8", className)}
    >
      <ul className="flex gap-6 overflow-x-auto px-4 [scrollbar-width:none] md:px-6 lg:px-8">
        {items.map((item) => {
          const isActive = item.href === active;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                ref={isActive ? activeRef : undefined}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "nav-link flex h-11 items-center gap-1.5 whitespace-nowrap font-display text-base font-semibold tracking-[0.04em] uppercase hover:bg-transparent",
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
