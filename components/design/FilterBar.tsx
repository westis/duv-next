"use client";

import { Suspense, useId, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  /** The URL query parameter this filter writes ("gender"). */
  param: string;
  label: string;
  options: FilterOption[];
  /** The current value; read from the URL when absent. */
  value?: string;
}

export interface FilterBarProps {
  filters: FilterDef[];
  /** Extra controls shown at every width, such as a name search field. */
  children?: ReactNode;
  className?: string;
}

/** Query parameters that reset when a filter changes. */
const RESET_PARAMS = ["page"];

/**
 * Filters above a table (design spec, "Filter bar"). Every filter writes to the
 * URL query string, so filtered views can be shared, and a change goes back to
 * page 1. Desktop: one row of compact selects. Mobile: a "Filters" button with
 * a count that opens a bottom sheet. Active filters show as removable chips at
 * every width.
 */
export function FilterBar(props: FilterBarProps) {
  // useSearchParams needs a Suspense boundary on statically rendered pages.
  return (
    <Suspense fallback={<FilterBarView {...props} search={new URLSearchParams()} pathname="" />}>
      <FilterBarWithUrl {...props} />
    </Suspense>
  );
}

function FilterBarWithUrl(props: FilterBarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  return <FilterBarView {...props} search={new URLSearchParams(searchParams.toString())} pathname={pathname} />;
}

function FilterBarView({
  filters,
  children,
  className,
  search,
  pathname,
}: FilterBarProps & { search: URLSearchParams; pathname: string }) {
  const t = useTranslations("filters");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const valueOf = (filter: FilterDef) => filter.value ?? search.get(filter.param) ?? "";
  const active = filters
    .map((filter) => {
      const value = valueOf(filter);
      const option = filter.options.find((o) => o.value === value);
      return value ? { filter, value, label: option?.label ?? value } : null;
    })
    .filter((x): x is { filter: FilterDef; value: string; label: string } => x !== null);

  const hrefWith = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(search.toString());
    for (const param of RESET_PARAMS) next.delete(param);
    for (const [param, value] of Object.entries(changes)) {
      if (value) next.set(param, value);
      else next.delete(param);
    }
    const qs = next.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  };

  const onChange = (param: string, value: string) => {
    startTransition(() => router.replace(hrefWith({ [param]: value || null }), { scroll: false }));
  };

  const clearHref = hrefWith(Object.fromEntries(filters.map((f) => [f.param, null])));

  // Without JavaScript the selects submit as a GET form; keep the other params.
  const filterParams = new Set([...filters.map((f) => f.param), ...RESET_PARAMS]);
  const kept = Array.from(search.entries()).filter(([param]) => !filterParams.has(param));
  const hiddenInputs = kept.map(([param, value], i) => (
    <input key={`${param}-${i}`} type="hidden" name={param} value={value} />
  ));

  const select = (filter: FilterDef, variant: "inline" | "sheet", id?: string) => {
    const value = valueOf(filter);
    return (
      <span className={cn("relative inline-flex", variant === "sheet" && "w-full")}>
        <select
          // Uncontrolled and re-keyed by the URL value, so the choice shows at once and resets on navigation.
          key={value}
          id={id}
          name={filter.param}
          defaultValue={value}
          aria-label={variant === "inline" ? filter.label : undefined}
          onChange={(event) => onChange(filter.param, event.target.value)}
          className={cn(
            "appearance-none rounded-md border border-border bg-surface ps-3 pe-8 text-fg hover:bg-surface-muted",
            variant === "inline" ? "h-9 max-w-48 text-sm" : "h-11 w-full text-base",
            value && "border-fg-muted font-medium"
          )}
        >
          <option value="">{variant === "inline" ? t("allOf", { label: filter.label }) : t("all")}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          strokeWidth={1.75}
          className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
        />
      </span>
    );
  };

  const sheetId = useId();

  return (
    <div className={cn("flex flex-col gap-2", className)} aria-busy={pending || undefined}>
      <div className="flex flex-wrap items-center gap-2">
        {children}

        {/* md+: one row of compact selects */}
        <form action={pathname || undefined} method="get" className="hidden flex-wrap items-center gap-2 md:flex">
          {hiddenInputs}
          {filters.map((filter) => (
            <span key={filter.param}>{select(filter, "inline")}</span>
          ))}
          <noscript>
            <button type="submit" className="h-9 rounded-md border border-border px-3 text-sm">
              {t("apply")}
            </button>
          </noscript>
        </form>

        {/* Mobile: one button that opens a bottom sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-fg hover:bg-surface-muted md:hidden"
              aria-label={active.length ? t("buttonWithCount", { count: active.length }) : undefined}
            >
              <SlidersHorizontal aria-hidden strokeWidth={1.75} className="size-4" />
              {t("button")}
              {active.length > 0 && (
                <span
                  aria-hidden
                  className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-fg tabular"
                >
                  {active.length}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] overflow-y-auto rounded-t-lg border-border bg-surface px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <SheetTitle className="text-lg font-semibold">{t("title")}</SheetTitle>
            <SheetDescription className="sr-only">{t("description")}</SheetDescription>
            <form action={pathname || undefined} method="get" className="mt-4 flex flex-col gap-4">
              {hiddenInputs}
              {filters.map((filter) => {
                const id = `${sheetId}-${filter.param}`;
                return (
                  <div key={filter.param} className="flex flex-col gap-1.5">
                    <label htmlFor={id} className="text-sm font-medium">
                      {filter.label}
                    </label>
                    {select(filter, "sheet", id)}
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-4 pt-2">
                {active.length > 0 ? (
                  <Link href={clearHref} scroll={false} className="inline-flex h-11 items-center text-sm">
                    {t("clear")}
                  </Link>
                ) : (
                  <span />
                )}
                <SheetClose asChild>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg"
                  >
                    {t("done")}
                  </button>
                </SheetClose>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="sr-only">{t("active")}</span>
          <ul className="flex flex-wrap items-center gap-2">
            {active.map(({ filter, label }) => (
              <li key={filter.param}>
                <Link
                  href={hrefWith({ [filter.param]: null })}
                  scroll={false}
                  aria-label={t("remove", { label: filter.label, value: label })}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-surface-muted ps-3 pe-2 text-xs font-medium text-fg no-underline hover:border-fg-muted [@media(pointer:coarse)]:h-11"
                >
                  <span className="text-fg-muted">{filter.label}:</span> {label}
                  <X aria-hidden strokeWidth={1.75} className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
          <Link href={clearHref} scroll={false} className="inline-flex h-8 items-center text-xs [@media(pointer:coarse)]:h-11">
            {t("clear")}
          </Link>
        </div>
      )}
    </div>
  );
}
