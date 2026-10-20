"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type BoardView = "W" | "M";

export interface ResultsBoardProps {
  /** Women's and men's lists, server-rendered; each list root carries data-list="W" or "M". */
  children: ReactNode;
  counts: { W: number; M: number };
  ageGroups: { value: string; label: string }[];
  nations: { value: string; count: number }[];
  labels: {
    show: string;
    women: string;
    men: string;
    ageGroup: string;
    allAgeGroups: string;
    nation: string;
    allNations: string;
    find: string;
    findLabel: string;
  };
}

interface Filters {
  view: BoardView;
  group: string;
  nat: string;
  query: string;
}

/** Query parameters the board reads and writes, so a filtered list can be shared. */
const PARAMS = { view: "g", group: "cat", nat: "nat", q: "q" } as const;

/**
 * The filters above the results: age group and nation as dropdowns, a name
 * search, and below xl a Women / Men switch (from xl both lists stand side by
 * side, women first). Rows are plain server-rendered tables that this hides
 * and shows, so everything reads without JavaScript. With an age group
 * chosen, the place column shows the place in the category.
 */
export function ResultsBoard({ children, counts, ageGroups, nations, labels }: ResultsBoardProps) {
  const [filters, setFilters] = useState<Filters>({ view: counts.W > 0 ? "W" : "M", group: "", nat: "", query: "" });
  const [ready, setReady] = useState(false);
  const { view, group, nat, query } = filters;
  const set = (change: Partial<Filters>) => setFilters((f) => ({ ...f, ...change }));
  const root = useRef<HTMLDivElement>(null);
  const ids = useId();

  // Start from the link's filters. The server render can't know them (the page is static), so this runs once after hydration.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const g = p.get(PARAMS.view);
    const cat = p.get(PARAMS.group) ?? "";
    const n = (p.get(PARAMS.nat) ?? "").toUpperCase();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one update, from the URL, after hydration
    setFilters((f) => ({
      view: (g === "W" && counts.W > 0) || (g === "M" && counts.M > 0) ? g : f.view,
      group: ageGroups.some((o) => o.value === cat) ? cat : "",
      nat: nations.some((o) => o.value === n) ? n : "",
      query: p.get(PARAMS.q) ?? "",
    }));
    setReady(true);
  }, [counts.W, counts.M, ageGroups, nations]);

  // Keep the link in step, without a navigation.
  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    const put = (key: string, value: string) => (value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
    put(PARAMS.view, view === "M" ? "M" : "");
    put(PARAMS.group, group);
    put(PARAMS.nat, nat);
    put(PARAMS.q, query.trim());
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [ready, view, group, nat, query]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = query.trim().toLocaleLowerCase();
    el.querySelectorAll<HTMLElement>("[data-list]").forEach((list) => {
      let shown = 0;
      list.querySelectorAll<HTMLTableRowElement>("tr[data-q]").forEach((tr) => {
        const match =
          (!q || (tr.dataset.q ?? "").includes(q)) &&
          (!group || tr.dataset.group === group) &&
          (!nat || tr.dataset.nat === nat);
        tr.hidden = !match;
        if (match) shown++;
      });
      const empty = list.querySelector<HTMLElement>("[data-empty]");
      if (empty) empty.hidden = shown > 0;
      const table = list.querySelector<HTMLElement>("table");
      if (table) table.hidden = shown === 0;
    });
  }, [query, group, nat]);

  const showSwitch = counts.W > 0 && counts.M > 0;
  const selectClass = (value: string) =>
    cn(
      "h-11 w-full appearance-none border-0 border-b border-border bg-bg ps-0 pe-6 text-base text-fg hover:border-fg md:h-9 md:text-sm",
      value && "border-fg font-semibold"
    );

  return (
    <div ref={root} data-view={view} data-bycat={group ? "" : undefined} className="group/board">
      <div className="-mx-4 md:sticky md:top-[calc(var(--header-h)+2.75rem)] md:z-20 border-b border-hair bg-bg px-4 py-2 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {showSwitch && (
            <div role="group" aria-label={labels.show} className="flex w-full items-center gap-1 sm:w-auto xl:hidden">
              {(["W", "M"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={view === g}
                  onClick={() => set({ view: g })}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-1.5 px-2 text-sm md:min-h-9",
                    view === g ? "font-semibold shadow-[inset_0_-2px_0_var(--fg)]" : "hover:underline"
                  )}
                >
                  {g === "W" ? labels.women : labels.men}
                  <span className="font-normal text-fg-muted tabular">{counts[g]}</span>
                </button>
              ))}
            </div>
          )}
          <div className="grid w-full grid-cols-2 gap-x-5 sm:flex sm:w-auto">
            {ageGroups.length > 1 && (
              <span className="relative inline-flex min-w-0 sm:w-44">
                <select
                  aria-label={labels.ageGroup}
                  value={group}
                  onChange={(e) => set({ group: e.target.value })}
                  className={selectClass(group)}
                >
                  <option value="">{labels.allAgeGroups}</option>
                  {ageGroups.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  strokeWidth={1.75}
                  className="pointer-events-none absolute end-0.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
                />
              </span>
            )}
            {nations.length > 1 && (
              <span className="relative inline-flex min-w-0 sm:w-44">
                <select
                  aria-label={labels.nation}
                  value={nat}
                  onChange={(e) => set({ nat: e.target.value })}
                  className={selectClass(nat)}
                >
                  <option value="">{labels.allNations}</option>
                  {nations.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.value} ({o.count})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  strokeWidth={1.75}
                  className="pointer-events-none absolute end-0.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
                />
              </span>
            )}
          </div>
          <div className="relative w-full sm:ms-auto sm:w-64">
            <label htmlFor={`${ids}-find`} className="sr-only">
              {labels.findLabel}
            </label>
            <Search
              className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              id={`${ids}-find`}
              type="search"
              value={query}
              onChange={(e) => set({ query: e.target.value })}
              placeholder={labels.find}
              autoComplete="off"
              className="h-11 w-full rounded-md border border-border bg-surface ps-8 pe-2 text-base md:h-9 md:text-sm"
            />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
