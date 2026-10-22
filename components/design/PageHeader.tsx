import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Breadcrumb, type Crumb } from "./Breadcrumb";

export interface PageHeaderProps {
  breadcrumb?: Crumb[];
  /** A line above the title that changes how the page reads, e.g. "This is a split of …". */
  notice?: ReactNode;
  /** Red small capitals above the title, e.g. "IAU 24 h World Championships". Use sparingly. */
  kicker?: ReactNode;
  title: ReactNode;
  /** A muted line under the title ("10th edition"). */
  subtitle?: ReactNode;
  /** Next to the title, e.g. an edition switcher. */
  titleAside?: ReactNode;
  /** One line: date, place, links. Separate items with `<MetaDot />`. */
  meta?: ReactNode;
  /** A `<TagList>`: small capitals separated by dots. */
  tags?: ReactNode;
  /** Key facts: a `<StatStrip>` of `<StatTile>`s, big condensed figures under a heavy ink rule. */
  facts?: ReactNode;
  className?: string;
}

/**
 * Shared header for race, runner, country and ranking pages, Swiss Grid look
 * (design-system/components/PageHeader.md): breadcrumb, red kicker and an
 * uppercase condensed title over 8 of 12 columns, the meta right-aligned over
 * the other 4, then the key facts. On phones the meta drops under the title,
 * left-aligned.
 */
export function PageHeader({ breadcrumb, notice, kicker, title, subtitle, titleAside, meta, tags, facts, className }: PageHeaderProps) {
  return (
    <header className={cn("pt-5 pb-2 md:pt-7", className)}>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      {notice && <div className="mt-3">{notice}</div>}
      <div className="mt-3 grid grid-cols-1 gap-y-3 md:grid-cols-12 md:items-end md:gap-x-6">
        <div className="min-w-0 md:col-span-8">
          {kicker && (
            <p className="font-display text-[0.9375rem] font-bold tracking-[0.06em] text-brand-ink uppercase">{kicker}</p>
          )}
          <div className={cn("flex flex-wrap items-end gap-x-4 gap-y-2", kicker && "mt-2")}>
            <h1 className="font-display text-[2.5rem] leading-[0.9] font-extrabold text-balance uppercase md:text-5xl lg:text-[4rem]">
              {title}
              {subtitle && (
                <>
                  {" "}
                  <span className="block pt-2 font-sans text-base leading-snug font-normal text-fg-muted normal-case md:text-lg">
                    {subtitle}
                  </span>
                </>
              )}
            </h1>
            {titleAside}
          </div>
          {tags && <div className="mt-3">{tags}</div>}
        </div>
        {meta && (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-normal text-fg md:col-span-4 md:justify-end md:text-end">
            {meta}
          </div>
        )}
      </div>
      {facts && <div className="mt-6">{facts}</div>}
    </header>
  );
}

/** Separator dot for meta lines. */
export function MetaDot() {
  return (
    <span aria-hidden className="text-fg-muted">
      ·
    </span>
  );
}
