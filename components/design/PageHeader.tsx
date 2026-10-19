import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Breadcrumb, type Crumb } from "./Breadcrumb";

export interface PageHeaderProps {
  breadcrumb?: Crumb[];
  title: ReactNode;
  /** Next to the title, e.g. an edition switcher. */
  titleAside?: ReactNode;
  /** One line: date, place, flag, links. */
  meta?: ReactNode;
  tags?: ReactNode;
  /** Key facts strip (`StatStrip`). */
  facts?: ReactNode;
  className?: string;
}

/**
 * Shared header for race, runner, country and ranking pages: breadcrumb →
 * title → meta line → tag row → key facts. Left-aligned, no background.
 */
export function PageHeader({ breadcrumb, title, titleAside, meta, tags, facts, className }: PageHeaderProps) {
  return (
    <header className={cn("space-y-3 pt-4 pb-5 md:pt-6", className)}>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl leading-tight font-semibold text-balance md:text-[2rem]">{title}</h1>
        {titleAside}
      </div>
      {meta && <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted">{meta}</div>}
      {tags}
      {facts && <div className="pt-1">{facts}</div>}
    </header>
  );
}

/** Separator dot for meta lines. */
export function MetaDot() {
  return <span aria-hidden>·</span>;
}
