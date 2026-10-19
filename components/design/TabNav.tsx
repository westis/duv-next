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
 * Underline tabs where every tab is its own route. Sticky under the site
 * header; scrolls sideways on mobile and keeps the active tab in view.
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
      className={cn("sticky top-14 z-30 -mx-4 border-b border-border bg-bg md:-mx-6 lg:-mx-8", className)}
    >
      <ul className="flex overflow-x-auto px-4 [scrollbar-width:none] md:px-6 lg:px-8 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] md:[mask-image:none]">
        {items.map((item) => {
          const isActive = item.href === active;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                ref={isActive ? activeRef : undefined}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px flex h-11 items-center gap-1.5 border-b-2 px-3 text-sm font-medium whitespace-nowrap no-underline transition-colors",
                  isActive
                    ? "border-brand text-fg"
                    : "border-transparent text-fg-muted hover:border-border hover:text-fg"
                )}
              >
                {item.label}
                {item.count !== undefined && <span className="text-fg-muted tabular">{item.count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
