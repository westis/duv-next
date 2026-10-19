import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  children: ReactNode;
  /** Muted Inter text after the heading: a count or a short note ("128 finishers"). */
  aside?: ReactNode;
  /** Anchor for an in-page section index (`SectionNav` item "#id"). */
  id?: string;
  /** Heading level; the look stays the same. Default h2. */
  as?: "h2" | "h3";
  className?: string;
}

/**
 * A section heading in the Almanac look: serif 22 px on phones, 26 px from md,
 * with an optional muted aside on the same baseline ("Results 128 finishers").
 */
export function SectionHeading({ children, aside, id, as: Tag = "h2", className }: SectionHeadingProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "mt-8 mb-1 flex flex-wrap items-baseline gap-x-3.5 gap-y-0.5 font-serif text-[1.375rem] leading-tight font-semibold md:mt-9 md:text-[1.625rem]",
        className
      )}
    >
      {children}
      {aside !== undefined && aside !== null && aside !== false && (
        <small className="font-sans text-sm font-normal text-fg-muted">{aside}</small>
      )}
    </Tag>
  );
}
