import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Breadcrumb, type Crumb } from "./Breadcrumb";

export interface PageHeaderProps {
  breadcrumb?: Crumb[];
  /** Red small capitals above the title, e.g. "IAU 24 h World Championships". Use sparingly. */
  kicker?: ReactNode;
  title: ReactNode;
  /** Italic serif line after the title ("10th edition"): beside it on desktop, under it on phones. */
  subtitle?: ReactNode;
  /** Next to the title, e.g. an edition switcher. */
  titleAside?: ReactNode;
  /** One line: date, place, links. Separate items with `<MetaDot />`. */
  meta?: ReactNode;
  /** A `<TagList>`: small capitals separated by dots. */
  tags?: ReactNode;
  /** Key facts: a `<StatStrip>` of `<StatTile>`s, big serif figures between rules. */
  facts?: ReactNode;
  className?: string;
}

/**
 * Shared header for race, runner, country and ranking pages (Almanac look):
 * small-caps breadcrumb, serif title, meta line, tags, and the key facts
 * between an ink rule and a hairline. Left-aligned, no band, no card.
 */
export function PageHeader({ breadcrumb, kicker, title, subtitle, titleAside, meta, tags, facts, className }: PageHeaderProps) {
  return (
    <header className={cn("pt-5 pb-2 md:pt-7", className)}>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      {kicker && <p className="label-caps mt-3 text-brand-ink">{kicker}</p>}
      <div className={cn("flex flex-wrap items-baseline gap-x-4 gap-y-1", kicker ? "mt-1" : "mt-2.5")}>
        <h1 className="font-serif text-[1.875rem] leading-[1.08] font-semibold tracking-[-0.015em] text-balance md:text-[2.375rem] lg:text-[2.75rem]">
          {title}
          {subtitle && (
            <>
              {" "}
              <span className="block pt-1 text-[1.0625rem] leading-snug font-normal tracking-normal text-fg-muted italic md:inline md:pt-0 md:text-xl">
                {subtitle}
              </span>
            </>
          )}
        </h1>
        {titleAside}
      </div>
      {meta && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg md:text-[0.9375rem]">{meta}</div>
      )}
      {tags && <div className="mt-2">{tags}</div>}
      {facts && <div className="mt-5">{facts}</div>}
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
