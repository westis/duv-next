import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/** One-line breadcrumb above a page title. On phones only the last two crumbs show. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const t = useTranslations("nav");
  if (!items.length) return null;
  return (
    <nav aria-label={t("breadcrumb")} className="min-w-0 text-xs text-fg-muted">
      <ol className="flex min-w-0 items-center whitespace-nowrap">
        {items.map((item, i) => (
          <li
            key={`${item.label}-${i}`}
            className={cn("flex min-w-0 items-center", i < items.length - 2 && "hidden sm:flex")}
          >
            {i > 0 && (
              <span aria-hidden className={cn("px-1", i === items.length - 2 && "hidden sm:inline")}>
                ›
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="nav-link truncate text-fg-muted hover:bg-transparent hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
