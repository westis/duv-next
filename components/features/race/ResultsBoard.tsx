"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type BoardView = "both" | "W" | "M";

export interface ResultsBoardProps {
  /** Women's and men's lists, server-rendered; each list root carries data-list="W" or "M". */
  children: ReactNode;
  counts: { W: number; M: number };
  labels: {
    show: string;
    both: string;
    women: string;
    men: string;
    find: string;
    findLabel: string;
    /** With "{q}" for the query. */
    noMatch: string;
  };
  /** Offer the find field (long fields only). */
  find?: boolean;
}

/**
 * The toolbar above the results: on phones and tablets a Women / Men / Both
 * switch (from xl both lists stand side by side), and a find field that hides
 * rows not matching a name or nation. The lists are plain server-rendered
 * tables, so everything reads without JavaScript.
 */
export function ResultsBoard({ children, counts, labels, find = false }: ResultsBoardProps) {
  const [view, setView] = useState<BoardView>("both");
  const [query, setQuery] = useState("");
  const [empty, setEmpty] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const statusId = useId();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = query.trim().toLocaleLowerCase();
    let shown = 0;
    el.querySelectorAll<HTMLTableSectionElement>("tbody[data-band]").forEach((tbody) => {
      let inBand = 0;
      tbody.querySelectorAll<HTMLTableRowElement>("tr[data-q]").forEach((tr) => {
        const match = !q || (tr.dataset.q ?? "").includes(q);
        tr.hidden = !match;
        if (match) inBand++;
      });
      tbody.hidden = inBand === 0;
      shown += inBand;
    });
    setEmpty(Boolean(q) && shown === 0);
  }, [query]);

  const options: { value: BoardView; label: string; count?: number }[] = [
    { value: "both", label: labels.both },
    { value: "W", label: labels.women, count: counts.W },
    { value: "M", label: labels.men, count: counts.M },
  ];
  const showSwitch = counts.W > 0 && counts.M > 0;

  return (
    <div ref={root} data-view={view} className="group/board">
      {(showSwitch || find) && (
        <div className="sticky top-[var(--header-h)] z-20 -mx-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-hair bg-bg px-4 py-2 md:-mx-6 md:px-6 lg:mx-0 lg:px-0">
          {showSwitch && (
            <div role="group" aria-label={labels.show} className="flex items-center gap-1 xl:hidden">
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={view === o.value}
                  onClick={() => setView(o.value)}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-1.5 px-2 text-sm md:min-h-9",
                    view === o.value ? "font-semibold shadow-[inset_0_-2px_0_var(--fg)]" : "hover:underline"
                  )}
                >
                  {o.label}
                  {o.count !== undefined && <span className="font-normal text-fg-muted tabular">{o.count}</span>}
                </button>
              ))}
            </div>
          )}
          {find && (
            <div className="relative w-full sm:ms-auto sm:w-72">
              <label htmlFor={inputId} className="sr-only">
                {labels.findLabel}
              </label>
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                id={inputId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={labels.find}
                aria-describedby={statusId}
                autoComplete="off"
                className="h-11 w-full rounded-md border border-border bg-surface ps-8 pe-2 text-base md:h-9 md:text-sm"
              />
            </div>
          )}
        </div>
      )}
      <p id={statusId} role="status" className={cn("mt-3 text-sm text-fg-muted", !empty && "sr-only")}>
        {empty ? labels.noMatch.replace("{q}", query.trim()) : ""}
      </p>
      {children}
    </div>
  );
}
