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

/** The chip type: condensed capitals (FilterChips.md). */
const CHIP = "font-display text-base leading-none font-semibold tracking-[0.04em] uppercase";

/** Query parameters that reset when a filter changes. */
const RESET_PARAMS = ["page"];

/**
 * Filters above a table, Swiss Grid look (design-system/components/FilterChips.md):
 * square chip-like selects with a hairline in control-border, filled with ink
 * once a value is chosen; removable square chips for the active filters. Every
 * filter writes to the
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
            "appearance-none border border-control-border bg-transparent text-fg [&>option]:bg-surface [&>option]:text-fg",
            variant === "inline"
              ? `h-9 max-w-56 ps-3 pe-8 ${CHIP} hover:bg-surface-muted`
              : "h-11 w-full ps-3 pe-8 text-base hover:bg-surface-muted",
            value && variant === "inline" && "border-fg bg-fg text-surface hover:bg-fg",
            value && variant === "sheet" && "border-fg font-medium"
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
          className={cn(
            "pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2",
            value && variant === "inline" ? "text-surface" : "text-fg-muted"
          )}
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
        <form action={pathname || undefined} method="get" className="hidden flex-wrap items-center gap-1.5 md:flex">
          {hiddenInputs}
          {filters.map((filter) => (
            <span key={filter.param}>{select(filter, "inline")}</span>
          ))}
          <noscript>
            <button type="submit" className={`h-9 border border-fg bg-fg px-3 text-surface ${CHIP}`}>
              {t("apply")}
            </button>
          </noscript>
        </form>

        {/* Mobile: one button that opens a bottom sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className={`inline-flex h-11 items-center gap-2 border border-control-border px-3 text-fg hover:bg-surface-muted md:hidden ${CHIP}`}
              aria-label={active.length ? t("buttonWithCount", { count: active.length }) : undefined}
            >
              <SlidersHorizontal aria-hidden strokeWidth={1.75} className="size-4" />
              {t("button")}
              {active.length > 0 && (
                <span
                  aria-hidden
                  className="inline-flex min-w-5 items-center justify-center bg-fg px-1.5 py-0.5 font-sans text-xs font-semibold tracking-normal text-surface tabular"
                >
                  {active.length}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] overflow-y-auto border-t border-fg bg-bg px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <SheetTitle className="font-display text-2xl leading-none font-extrabold uppercase">{t("title")}</SheetTitle>
            <SheetDescription className="sr-only">{t("description")}</SheetDescription>
            <form action={pathname || undefined} method="get" className="mt-4 flex flex-col gap-4">
              {hiddenInputs}
              {filters.map((filter) => {
                const id = `${sheetId}-${filter.param}`;
                return (
                  <div key={filter.param} className="flex flex-col gap-1.5">
                    <label htmlFor={id} className="label-caps text-fg-muted">
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
                    className={`inline-flex h-11 items-center border border-fg bg-fg px-5 text-surface ${CHIP}`}
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
                  className="inline-flex h-8 items-center gap-1.5 border border-fg bg-fg ps-3 pe-2 text-sm text-surface no-underline hover:bg-fg/85 [@media(pointer:coarse)]:h-11"
                >
                  <span className="opacity-75">{filter.label}:</span> <span className="font-semibold">{label}</span>
                  <X aria-hidden strokeWidth={1.75} className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
          <Link href={clearHref} scroll={false} className="inline-flex h-8 items-center text-sm [@media(pointer:coarse)]:h-11">
            {t("clear")}
          </Link>
        </div>
      )}
    </div>
  );
}
