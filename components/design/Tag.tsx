import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { TagFamily, TagSpec, TagTone } from "@/lib/tags";

const base =
  "inline-flex h-[22px] max-w-full shrink-0 items-center gap-1.5 rounded-sm px-2 text-xs font-medium whitespace-nowrap no-underline [@media(pointer:coarse)]:h-6";

const familyClass: Record<TagFamily, string> = {
  distance: "border border-border bg-surface-muted text-fg font-semibold tabular",
  type: "bg-tag-type text-tag-type-fg",
  surface: "bg-tag-surface text-tag-surface-fg",
  iau: "bg-gold text-gold-fg",
  championship: "bg-brand text-brand-fg",
  status: "px-0 text-fg-muted",
};

const iauTone: Partial<Record<TagTone, string>> = {
  gold: "bg-gold text-gold-fg",
  silver: "bg-silver text-silver-fg",
  bronze: "bg-bronze text-bronze-fg",
  muted: "bg-surface-muted text-fg-muted",
};

const dotTone: Partial<Record<TagTone, string>> = {
  gold: "bg-medal-gold",
  silver: "bg-medal-silver",
  bronze: "bg-medal-bronze",
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
 * One tag. Families own a colour (design spec, "Tags"); every tag has a text
 * label, so colour never stands alone. Metals and status get a dot.
 */
export function Tag({ family, tone, icon, href, title, className, children }: TagProps) {
  const showDot = family === "status" || (family === "iau" && tone && tone !== "muted");
  const classes = cn(base, familyClass[family], family === "iau" && tone && iauTone[tone], className);
  const content = (
    <>
      {showDot && (
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", tone && dotTone[tone])} />
      )}
      {icon}
      <span className="truncate">{children}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} title={title} className={cn(classes, "hover:brightness-95")}>
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

/** Renders a `raceTags()` list with translated labels; `max` caps it (calendar rows on mobile). */
export function TagList({ tags, max, className }: { tags: TagSpec[]; max?: number; className?: string }) {
  const t = useTranslations("tags");
  const shown = max ? tags.slice(0, max) : tags;
  const hidden = tags.length - shown.length;
  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {shown.map((tag) => {
        const label = tag.family === "distance" ? tag.text : t(tag.key);
        return (
          <li key={tag.family === "distance" ? `d-${tag.text}` : tag.key} className="flex">
            <Tag family={tag.family} tone={tag.family === "distance" ? undefined : tag.tone} title={label}>
              {label}
            </Tag>
          </li>
        );
      })}
      {hidden > 0 && <li className="text-xs text-fg-muted">{t("more", { count: hidden })}</li>}
    </ul>
  );
}
