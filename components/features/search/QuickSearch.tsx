"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { DateText, formatCount, formatRunnerName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QuickRace, QuickResult } from "./data";
import { ActiveSpan, spanText } from "./ActiveSpan";
import { FinisherSparkline } from "./FinisherSparkline";
import { formatDistances, formatPlace, sexKey } from "./raceText";
import { spanAxis, type RunnerRow } from "./races";
import { isIdQuery, searchHref } from "./params";

const MIN_CHARS = 2;

type Column = "ids" | "runners" | "races";
interface Option {
  id: string;
  href: string;
  column: Column;
}

const runnerHref = (id: string) => `/runners/${id}`;
const raceHref = (id: string) => `/events/${id}`;

/**
 * Quick search, direction A ("index with time"): the header turns into the
 * search field and the answer fills the width under it in two columns,
 * Runners | Races, pushing the page down rather than covering it. Phones get
 * the same as a full screen. A race is one row however many editions it has;
 * a runner carries their active years on a time axis shared by the list.
 *
 * Keyboard: ↑ ↓ choose, ← → switch column, Enter opens, Shift+Enter opens all
 * results, Esc closes. The field is a combobox; options are real links.
 */
export function QuickSearch({ onClose }: { onClose: () => void }) {
  const t = useTranslations("search");
  const tSite = useTranslations("site");
  const locale = useLocale();
  const router = useRouter();
  const baseId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [term, setTerm] = useState("");
  const [result, setResult] = useState<QuickResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const query = useDebounce(term.trim(), 200);
  const ready = query.length >= MIN_CHARS;

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- shows "Searching" while the request runs
    setLoading(true);
    fetch(`/search/quick?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: QuickResult) => {
        setResult(data);
        // A number typed alone: its runner or race is chosen, so Enter goes there.
        setActive(data.ids.runner || data.ids.race ? 0 : -1);
      })
      .catch((error: unknown) => {
        if ((error as Error).name === "AbortError") return;
        setResult({ query, runners: [], runnerTotal: 0, races: [], raceTotal: 0, editionTotal: 0, ids: { runner: null, race: null }, error: true });
        setActive(-1);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, ready]);

  // Phones: the search is a full screen, so the page under it must not scroll.
  useEffect(() => {
    if (!window.matchMedia("(width < 64rem)").matches) return;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = before;
    };
  }, []);

  // A click on the page under the panel closes it (desktop, where the page shows).
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [onClose]);

  const shown = ready && result && result.query === query ? result : null;
  const runners = shown?.runners ?? [];
  const races = shown?.races ?? [];
  const idRunner = shown?.ids.runner ?? null;
  const idRace = shown?.ids.race ?? null;
  const axis = spanAxis(runners);

  const options: Option[] = [];
  if (idRunner) options.push({ id: `${baseId}-id-runner`, href: runnerHref(idRunner.id), column: "ids" });
  if (idRace) options.push({ id: `${baseId}-id-race`, href: raceHref(idRace.key), column: "ids" });
  runners.forEach((r) => options.push({ id: `${baseId}-r-${r.id}`, href: runnerHref(r.id), column: "runners" }));
  races.forEach((g) => options.push({ id: `${baseId}-e-${g.key}`, href: raceHref(g.shown.id), column: "races" }));
  const activeOption = active >= 0 ? options[active] : undefined;

  const allHref = searchHref({ sname: term.trim() });
  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown" && options.length) {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp" && options.length) {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && activeOption && activeOption.column !== "ids") {
      // Switch between the Runners and Races columns, keeping the row where it can.
      const from = activeOption.column;
      const to: Column = from === "runners" ? "races" : "runners";
      const start = options.findIndex((o) => o.column === from);
      const target = options.filter((o) => o.column === to);
      if (!target.length) return;
      e.preventDefault();
      const row = Math.min(active - start, target.length - 1);
      setActive(options.indexOf(target[row]));
    } else if (e.key === "Enter") {
      if (!term.trim()) return;
      e.preventDefault();
      if (e.shiftKey || !activeOption) go(allHref);
      else go(activeOption.href);
    }
  };

  // Keep the chosen row in view inside the scrolling panel.
  const activeId = activeOption?.id;
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  const listId = `${baseId}-list`;
  const hasAny = runners.length > 0 || races.length > 0 || idRunner || idRace;
  const numeric = isIdQuery(query);

  const optionProps = (index: number) => ({
    id: options[index].id,
    role: "option" as const,
    "aria-selected": index === active,
    tabIndex: -1,
    onMouseMove: () => active !== index && setActive(index),
    onClick: onClose,
    className: cn(
      "nav-link -mx-2.5 block rounded-sm px-2.5 py-2 hover:bg-surface-muted",
      index === active && "bg-surface-muted shadow-[inset_3px_0_0_var(--link)]"
    ),
  });

  let index = 0;
  const idOptions: ReactNode[] = [];
  if (idRunner) {
    const i = index++;
    idOptions.push(
      <Link key="runner" href={runnerHref(idRunner.id)} {...optionProps(i)}>
        <span className="label-caps me-2 text-fg-muted">{t("runnerId", { id: idRunner.id })}</span>
        <span className="font-semibold">{formatRunnerName({ first: idRunner.first, last: idRunner.last }, locale)}</span>
        <span className="ms-2 text-sm text-fg-muted tabular">
          {[idRunner.nat, idRunner.yob, spanText(idRunner.from, idRunner.to)].filter(Boolean).join(" · ")}
        </span>
      </Link>
    );
  }
  if (idRace) {
    const i = index++;
    idOptions.push(
      <Link key="race" href={raceHref(idRace.key)} {...optionProps(i)}>
        <span className="label-caps me-2 text-fg-muted">{t("raceId", { id: idRace.key })}</span>
        <span className="font-semibold">{idRace.shown.name}</span>
        <span className="ms-2 text-sm text-fg-muted">
          <DateText value={idRace.shown.date} locale={locale} />
          {" · "}
          {[formatPlace(idRace.city, idRace.country), formatDistances(idRace.distances, locale)].filter(Boolean).join(" · ")}
        </span>
      </Link>
    );
  }
  const runnerStart = index;
  index += runners.length;
  const raceStart = index;

  const counts = shown && !numeric
    ? t("hint", { runners: shown.runnerTotal, editions: shown.editionTotal })
    : "";

  return (
    <div
      ref={panelRef}
      data-quick-search
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg lg:static lg:block lg:overflow-visible"
    >
      <div className="border-b-2 border-brand">
        <div className="container flex h-14 items-center gap-3 lg:h-16 lg:gap-5">
          <Link
            href="/"
            onClick={onClose}
            aria-label={tSite("home")}
            className="nav-link hidden font-serif text-[1.625rem] leading-none font-bold text-brand hover:bg-transparent lg:inline"
          >
            DUV
          </Link>
          <Search className="size-5 shrink-0 text-fg-muted" strokeWidth={1.75} aria-hidden />
          <input
            ref={inputRef}
            autoFocus
            type="search"
            role="combobox"
            aria-expanded={Boolean(hasAny)}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeOption?.id}
            aria-label={t("label")}
            placeholder={t("placeholder")}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setActive(-1);
            }}
            onKeyDown={onKeyDown}
            className="h-full min-w-0 flex-1 bg-transparent text-lg font-medium text-fg outline-none placeholder:font-normal placeholder:text-fg-muted lg:text-[1.375rem] [&::-webkit-search-cancel-button]:hidden"
          />
          <span aria-live="polite" className="hidden text-sm text-fg-muted lg:inline">
            {loading ? t("searching") : counts}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center px-1 text-[0.9375rem] font-medium text-link lg:hidden"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="hidden min-h-9 items-center lg:inline-flex"
          >
            <kbd className="kbd rounded-sm border border-b-2 px-1.5 py-0.5 font-sans text-xs">Esc</kbd>
          </button>
        </div>
      </div>

      <div className="flex-1 lg:max-h-[calc(100dvh-9rem)] lg:flex-none lg:overflow-y-auto">
        <span aria-live="polite" className="sr-only lg:hidden">
          {loading ? t("searching") : counts}
        </span>

        {!ready && (
          <p className="container py-4 text-sm text-fg-muted">{t("intro")}</p>
        )}

        {ready && shown?.error && !hasAny && (
          <p className="container py-4 text-sm text-fg-muted">{t("failed")}</p>
        )}

        {ready && shown && !shown.error && !hasAny && (
          <p className="container py-4 text-sm text-fg-muted">
            {numeric ? t("noId", { id: query }) : t("nothing", { query })}
          </p>
        )}

        {hasAny && (
          <div id={listId} role="listbox" aria-label={t("results")} className="border-b border-border">
            {idOptions.length > 0 && (
              <div role="group" aria-label={t("goTo")} className="container py-3">
                {idOptions}
              </div>
            )}
            {(runners.length > 0 || races.length > 0) && (
              <div className="container lg:grid lg:grid-cols-[5fr_7fr]">
                <QuickColumn
                  id={`${baseId}-rh`}
                  title={t("runners")}
                  aside={runners.length ? formatCount(shown?.runnerTotal, locale) : t("noneShort")}
                  className="lg:pe-8"
                >
                  {runners.map((r, i) => (
                    <li key={r.id} role="none">
                      <Link href={runnerHref(r.id)} {...optionProps(runnerStart + i)}>
                        <RunnerOption runner={r} axis={axis} locale={locale} />
                      </Link>
                    </li>
                  ))}
                </QuickColumn>
                <QuickColumn
                  id={`${baseId}-eh`}
                  title={t("races")}
                  aside={races.length ? t("groupedNote") : t("noneShort")}
                  className="border-t border-hair lg:border-t-0 lg:border-s lg:border-border lg:ps-8"
                >
                  {races.map((g, i) => (
                    <li key={g.key} role="none">
                      <Link href={raceHref(g.shown.id)} {...optionProps(raceStart + i)}>
                        <RaceOption race={g} locale={locale} />
                      </Link>
                    </li>
                  ))}
                </QuickColumn>
              </div>
            )}
          </div>
        )}

        {/* Desktop: the keys, and the id jump. */}
        <div className="hidden bg-surface-muted lg:block">
          <div className="container flex flex-wrap items-center gap-x-5 gap-y-1 py-2.5 text-xs text-fg-muted">
            <span>
              <Kbd>↑</Kbd> <Kbd>↓</Kbd> {t("keys.choose")}
            </span>
            <span>
              <Kbd>←</Kbd> <Kbd>→</Kbd> {t("keys.columns")}
            </span>
            <span>
              <Kbd>Enter</Kbd> {t("keys.open")}
            </span>
            <span>
              <Kbd>Shift Enter</Kbd> {t("keys.all")}
            </span>
            {term.trim() && (
              <Link href={allHref} onClick={onClose} className="font-medium">
                {t("allResults", { query: term.trim() })}
              </Link>
            )}
            <span className="ms-auto">{t("idHint")}</span>
          </div>
        </div>
      </div>

      {/* Phones: one button for the full results page, always in reach. */}
      {term.trim() && (
        <div className="sticky bottom-0 border-t border-border bg-bg px-4 py-3 lg:hidden">
          <Link
            href={allHref}
            onClick={onClose}
            className="btn flex h-11 items-center justify-center rounded-md bg-fg px-4 text-sm font-semibold text-bg no-underline"
          >
            <span className="truncate">{t("allResults", { query: term.trim() })}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd rounded-sm border border-b-2 px-1.5 py-0.5 font-sans text-[0.6875rem]">{children}</kbd>;
}

function QuickColumn({
  id,
  title,
  aside,
  className,
  children,
}: {
  id: string;
  title: string;
  aside: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-labelledby={id} className={cn("py-3 lg:pt-3.5 lg:pb-4", className)}>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span id={id} className="label-caps text-fg">
          {title}
        </span>
        <span className="text-xs text-fg-muted tabular">{aside}</span>
      </div>
      <ul role="none" className="divide-y divide-hair lg:divide-y-0">
        {children}
      </ul>
    </div>
  );
}

function RunnerOption({ runner, axis, locale }: { runner: RunnerRow; axis: ReturnType<typeof spanAxis>; locale: string }) {
  const t = useTranslations("search");
  const sex = sexKey(runner.gender);
  const sub = [runner.origName, [runner.club, runner.city].filter(Boolean).join(" · ")].filter(Boolean).join(" · ");
  const facts = [runner.nat, sex ? t(`sex.${sex}`) : "", runner.yob].filter(Boolean);
  return (
    <span className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 lg:grid-cols-[minmax(0,1fr)_2.5rem_1rem_2.5rem_8.5rem] lg:items-center">
      <span className="min-w-0">
        <span className="font-semibold text-fg">{formatRunnerName({ first: runner.first, last: runner.last }, locale)}</span>
        {sub && <span className="block truncate text-sm text-fg-muted">{sub}</span>}
      </span>
      <span className="text-sm whitespace-nowrap text-fg-muted tabular lg:hidden">{facts.join(" · ")}</span>
      <span className="hidden text-sm text-fg-muted tabular lg:block">{runner.nat}</span>
      <span className="hidden text-sm text-fg-muted lg:block">{sex ? t(`sex.${sex}`) : ""}</span>
      <span className="hidden text-sm text-fg-muted tabular lg:block">{runner.yob}</span>
      <ActiveSpan
        from={runner.from}
        to={runner.to}
        axis={axis}
        className="col-span-2 mt-1.5 lg:col-span-1 lg:mt-0"
      />
    </span>
  );
}

function RaceOption({ race, locale }: { race: QuickRace; locale: string }) {
  const t = useTranslations("search");
  const sub = [
    formatPlace(race.city, race.country),
    formatDistances(race.distances, locale),
    race.editionCount > 1 ? t("editionsSince", { count: race.editionCount, year: race.firstYear }) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const field = race.shown.upcoming
    ? t("upcoming")
    : race.lastField !== null
      ? t("finishersShort", { count: formatCount(race.lastField, locale) ?? "" })
      : "";
  return (
    <span className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 lg:grid-cols-[minmax(0,1fr)_9.5rem_4.5rem_6.25rem] lg:items-center">
      <span className="min-w-0">
        <span className="font-semibold text-fg">{race.name}</span>
        <span className="block text-sm text-fg-muted">{sub}</span>
      </span>
      <span className="text-sm whitespace-nowrap text-fg-muted lg:hidden">
        <DateText value={race.shown.date} locale={locale} />
      </span>
      <span className="col-span-2 mt-1 flex items-center gap-3 lg:col-span-1 lg:mt-0 lg:block">
        <FinisherSparkline years={race.years} locale={locale} />
        <span className="text-xs text-fg-muted tabular lg:hidden">{field}</span>
      </span>
      <span className="hidden text-end text-sm text-fg-muted tabular lg:block">{field}</span>
      <span className="hidden text-end text-sm whitespace-nowrap text-fg-muted lg:block">
        <DateText value={race.shown.date} locale={locale} />
      </span>
    </span>
  );
}
