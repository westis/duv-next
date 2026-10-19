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
 * A few mutually exclusive filters as plain text links (All · Women · Men),
 * Almanac look: the current one bold with an ink underline. Each is a URL, so
 * the view can be shared and works before JavaScript loads. For many options
 * use `FilterBar`'s selects instead.
 */
export function FilterLinks({ items, label, className }: { items: FilterLinkItem[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex flex-wrap items-center gap-x-5 text-sm">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.current ? "true" : undefined}
              className={cn(
                "nav-link inline-flex min-h-11 items-center gap-1.5 hover:bg-transparent md:min-h-9",
                item.current ? "font-semibold shadow-[inset_0_-2px_0_var(--fg)]" : "hover:underline"
              )}
            >
              {item.label}
              {item.count !== undefined && <span className="font-normal text-fg-muted tabular">{item.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
