import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { TagFamily, TagSpec, TagTone } from "@/lib/tags";

/**
 * Swiss Grid tags (design-system/components/Tag.md) are text, not pills:
 * uppercase condensed labels separated by dots (TRAIL · FIXED DISTANCE ·
 * IAU BRONZE). Only IAU labels and championships take the red.
 */
const caps = "font-display text-[0.9375rem] leading-tight font-bold tracking-[0.04em] uppercase";
const base = "inline-flex max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap no-underline";

const familyClass: Record<TagFamily, string> = {
  // A figure with its unit: ink, not capitals ("117 km", "24 h").
  distance: "text-sm font-semibold text-fg tabular",
  type: `${caps} text-fg-muted`,
  surface: `${caps} text-fg-muted`,
  iau: `${caps} text-brand-ink`,
  championship: `${caps} text-brand-ink`,
  status: `${caps} text-fg`,
};

const dotTone: Partial<Record<TagTone, string>> = {
  success: "bg-success",
  warning: "bg-warning",
  muted: "bg-fg-muted",
};

export interface TagProps {
  family: TagFamily;
  tone?: TagTone;
  icon?: ReactNode;
  /** Makes the tag a filter link. */
  href?: string;
  /** Full text for the tooltip when the label is truncated. */
  title?: string;
  className?: string;
  children: ReactNode;
}

/**
 * One tag. Every tag is its text, so colour never stands alone; results status
 * gets a 6 px dot in its tone beside its word.
 */
export function Tag({ family, tone, icon, href, title, className, children }: TagProps) {
  const dot = family === "status" && tone ? dotTone[tone] : undefined;
  const classes = cn(base, familyClass[family], className);
  const content = (
    <>
      {dot && <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", dot)} />}
      {icon}
      <span className="truncate">{children}</span>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        title={title}
        className={cn(classes, "min-h-6 underline-offset-4 hover:text-fg hover:underline")}
      >
        {content}
      </Link>
    );
  }
  return (
    <span title={title} className={classes}>
      {content}
    </span>
  );
}

/**
 * Renders a `raceTags()` list with translated labels, separated by dots;
 * `max` caps it (calendar rows on mobile).
 */
export function TagList({ tags, max, className }: { tags: TagSpec[]; max?: number; className?: string }) {
  const t = useTranslations("tags");
  const shown = max ? tags.slice(0, max) : tags;
  const hidden = tags.length - shown.length;
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1 leading-5", className)}>
      {shown.map((tag, i) => {
        const label = tag.family === "distance" ? tag.text : t(tag.key);
        return (
          <li key={tag.family === "distance" ? `d-${tag.text}` : tag.key} className="flex items-center gap-1.5">
            <Tag family={tag.family} tone={tag.family === "distance" ? undefined : tag.tone} title={label}>
              {label}
            </Tag>
            {/* The dot trails its tag, so a wrapped line never starts with one. */}
            {(i < shown.length - 1 || hidden > 0) && (
              <span aria-hidden className="text-xs text-fg-muted">
                ·
              </span>
            )}
          </li>
        );
      })}
      {hidden > 0 && <li className="text-xs text-fg-muted">{t("more", { count: hidden })}</li>}
    </ul>
  );
}
