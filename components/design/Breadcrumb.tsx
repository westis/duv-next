import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * One-line breadcrumb above a page title, in small capitals with "/" between
 * crumbs ("RACES / 2025 / CHINA"). A last crumb without a link is the page
 * itself: the title already shows it, so it is read by screen readers only.
 * On phones only the last two linked crumbs show.
 */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  const t = useTranslations("nav");
  if (!items.length) return null;
  const lastLinked = items.findLastIndex((item) => item.href);
  return (
    <nav aria-label={t("breadcrumb")} className={cn("label-caps min-w-0 tracking-[0.1em] text-fg-muted", className)}>
      <ol className="flex min-w-0 items-center whitespace-nowrap">
        {items.map((item, i) => {
          const current = !item.href && i === items.length - 1;
          return (
            <li
              key={`${item.label}-${i}`}
              className={cn(
                "flex min-w-0 items-center",
                i < lastLinked - 1 && "hidden sm:flex",
                current && "sr-only"
              )}
            >
              {i > 0 && (
                <span aria-hidden className={cn("px-1.5", i === lastLinked - 1 && "hidden sm:inline")}>
                  /
                </span>
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="nav-link inline-flex min-h-6 items-center truncate text-fg-muted hover:bg-transparent hover:text-fg hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={current ? "page" : undefined} className="truncate">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
