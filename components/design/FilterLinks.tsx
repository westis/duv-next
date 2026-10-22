import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FilterLinkItem {
  href: string;
  label: string;
  /** Muted count after the label ("Women 161"). */
  count?: number | string;
  /** The filter now applied. */
  current?: boolean;
}

/**
 * A few mutually exclusive filters (All · Women · Men) as a row of square chips,
 * Swiss Grid look (design-system/components/FilterChips.md): a hairline in
 * control-border, the current one filled with ink. Each is a URL, so
 * the view can be shared and works before JavaScript loads. For many options
 * use `FilterBar`'s selects instead.
 */
export function FilterLinks({ items, label, className }: { items: FilterLinkItem[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex flex-wrap items-center gap-1.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.current ? "true" : undefined}
              className={cn(
                "nav-link inline-flex min-h-11 items-center gap-1.5 border px-3 font-display text-base leading-none font-semibold tracking-[0.04em] uppercase md:min-h-9",
                item.current
                  ? "border-fg bg-fg text-surface hover:bg-fg hover:text-surface"
                  : "border-control-border text-fg hover:bg-surface-muted"
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span className={cn("font-sans text-sm font-normal tracking-normal normal-case tabular", item.current ? "opacity-75" : "text-fg-muted")}>
                  {item.count}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
