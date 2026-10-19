import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionNav, type SectionNavItem } from "./SectionNav";

export interface SectionLayoutProps {
  /** The page's sections, routes or "#anchors" (see `SectionNav`). Under two, no navigation shows. */
  items: SectionNavItem[];
  /** Accessible name of the section navigation ("Race sections"). */
  label: string;
  /** Small-caps heading of the desktop rail ("This race"). */
  heading?: ReactNode;
  /** Under the rail's list on desktop, e.g. source links. */
  railFooter?: ReactNode;
  /** The page header (`PageHeader`), in the content column beside the rail. */
  header?: ReactNode;
  /** Phone jump row sticks under the top of the screen (long one-page layouts). */
  stickyRow?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * A page with sections, Almanac look (race, runner, country pages): on desktop
 * a 200 px contents rail on the left, sticky under the site header, beside a
 * fluid column with the header and content; on phones the header, then a jump
 * row of section links, then content. Fills the site's content column.
 */
export function SectionLayout({
  items,
  label,
  heading,
  railFooter,
  header,
  stickyRow,
  children,
  className,
}: SectionLayoutProps) {
  const hasNav = items.length > 1;
  return (
    <div
      className={cn(
        "container",
        hasNav && "lg:grid lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-12",
        className
      )}
    >
      {hasNav && (
        <aside className="hidden lg:block">
          <div className="sticky top-[var(--header-h)] max-h-[calc(100dvh-var(--header-h))] overflow-y-auto pt-9 pb-6">
            <SectionNav items={items} label={label} heading={heading} variant="rail" />
            {railFooter && <div className="mt-7 text-sm">{railFooter}</div>}
          </div>
        </aside>
      )}
      <div className="min-w-0">
        {header}
        {hasNav && (
          <SectionNav items={items} label={label} variant="row" sticky={stickyRow} className="mt-3 lg:hidden" />
        )}
        {children}
      </div>
    </div>
  );
}
