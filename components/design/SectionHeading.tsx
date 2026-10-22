import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  children: ReactNode;
  /** Muted body text after the heading: a count or a short note ("128 finishers"). */
  aside?: ReactNode;
  /** Anchor for an in-page section index (`SectionNav` item "#id"). */
  id?: string;
  /** Heading level; the look stays the same. Default h2. */
  as?: "h2" | "h3";
  className?: string;
}

/**
 * A section heading, Swiss Grid look (design-system/components/SectionHeading.md):
 * uppercase condensed title on a 3 px ink rule, with an optional muted aside on
 * the right ("Results … 128 finishers").
 */
export function SectionHeading({ children, aside, id, as: Tag = "h2", className }: SectionHeadingProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "mt-8 mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-[length:var(--rule-mid)] border-fg pb-2 font-display text-[1.625rem] leading-none font-extrabold uppercase md:mt-10 md:text-[2rem]",
        className
      )}
    >
      {children}
      {aside !== undefined && aside !== null && aside !== false && (
        <small className="font-sans text-sm font-normal text-fg-muted normal-case">{aside}</small>
      )}
    </Tag>
  );
}
