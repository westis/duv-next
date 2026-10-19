"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  type CalendarFilterState,
  type RangePreset,
  type Surface,
  SURFACES,
  calendarHref,
  defaultOrder,
  parseCalendarParams,
  presetRange,
} from "./params";
import type { Option, OptionGroup } from "./params";

export interface CalendarSentenceProps {
  state: CalendarFilterState;
  /** Today as yyyy-mm-dd, from the server, so presets match the list. */
  today: string;
  formats: OptionGroup[];
  countries: Option[];
  cups: Option[];
}

const PRESETS: RangePreset[] = ["next30", "next12m", "last14", "last12m", "thisYear"];

/** The look of an editable word in the sentence: ink, semibold, dotted link-coloured underline. */
const field =
  "relative inline-flex min-h-11 items-center gap-0.5 font-semibold text-fg underline decoration-link decoration-dotted decoration-2 underline-offset-[0.3em] hover:decoration-solid focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand md:min-h-0";

/**
 * The calendar filters as one sentence you edit in place: "Races from 19 OCT 2026
 * to 19 OCT 2027 in all countries, any format, on any surface." Every word in
 * ink is a control; each change is a new URL, so a view can be shared.
 */
export function CalendarSentence({ state, today, formats, countries, cups }: CalendarSentenceProps) {
  const t = useTranslations("calendar.filters");
  const tTags = useTranslations("tags");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const go = (patch: Partial<CalendarFilterState>) => {
    const next = { ...state, page: 1, ...patch };
    startTransition(() => router.push(calendarHref(next), { scroll: false }));
  };

  const hasRange = !!(state.from && state.to);
  const formatLabel =
    state.dist === "all"
      ? t("anyFormat")
      : (formats.flatMap((g) => g.options).find((o) => o.value === state.dist)?.label ?? state.dist);
  const countryLabel =
    state.country === "all" ? t("allCountries") : (countries.find((o) => o.value === state.country)?.label ?? state.country);
  const surfaceLabel = state.surface === "all" ? t("anySurface") : tTags(`surface.${state.surface}`);

  const dateField = (which: "from" | "to") => {
    const iso = which === "from" ? (state.from ?? today) : (state.to ?? "");
    return (
      <DateRangeField
        key={which}
        state={state}
        today={today}
        label={formatDate(iso, locale)?.text ?? iso}
        onApply={(from, to) => go({ from, to, order: defaultOrder(from, new Date(`${today}T12:00:00Z`)) })}
      />
    );
  };

  const fields = {
    from: () => dateField("from"),
    to: () => dateField("to"),
    country: () => (
      <SelectField
        label={t("countryLabel")}
        text={countryLabel}
        value={state.country}
        onChange={(country) => go({ country })}
      >
        <option value="all">{t("allCountries")}</option>
        {countries.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </SelectField>
    ),
    format: () => (
      <SelectField label={t("formatLabel")} text={formatLabel} value={state.dist} onChange={(dist) => go({ dist })}>
        <option value="all">{t("anyFormat")}</option>
        {formats.map((group, i) => [
          <option key={`sep-${i}`} disabled>
            ──────
          </option>,
          ...group.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          )),
        ])}
      </SelectField>
    ),
    surface: () => (
      <SelectField
        label={t("surfaceLabel")}
        text={surfaceLabel}
        value={state.surface}
        onChange={(surface) => go({ surface: surface as Surface | "all" })}
      >
        <option value="all">{t("anySurface")}</option>
        {SURFACES.map((s) => (
          <option key={s} value={s}>
            {tTags(`surface.${s}`)}
          </option>
        ))}
      </SelectField>
    ),
  };

  const defaults = parseCalendarParams({});
  const isFiltered =
    hasRange ||
    state.dist !== "all" ||
    state.surface !== "all" ||
    state.country !== "all" ||
    state.cups !== "all" ||
    state.rproof ||
    state.norslt ||
    state.splits ||
    state.iau;
  const moreCount = [state.rproof, state.norslt, state.splits, state.cups !== "all"].filter(Boolean).length;

  return (
    <div aria-busy={isPending} className={cn("transition-opacity", isPending && "opacity-70")}>
      <p className="max-w-4xl text-[1.1875rem] leading-[1.9] text-fg md:text-[1.375rem] md:leading-[1.6]">
        {t.rich(hasRange ? "sentenceRange" : "sentenceOnward", fields)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 md:min-h-9">
          <input
            type="checkbox"
            checked={state.iau}
            onChange={(e) => go({ iau: e.target.checked })}
            className="size-4 accent-[var(--fg)]"
          />
          {t("iauOnly")}
        </label>
        <MoreFilters state={state} cups={cups} count={moreCount} onChange={go} />
        <Link
          href={calendarHref({ ...state, page: 1, order: state.order === "asc" ? "desc" : "asc" })}
          scroll={false}
          className="inline-flex min-h-11 items-center text-fg no-underline hover:underline md:min-h-9"
        >
          {state.order === "asc" ? t("soonestFirst") : t("latestFirst")}
        </Link>
        {isFiltered && (
          <Link
            href={calendarHref({ ...defaults, perpage: state.perpage })}
            scroll={false}
            className="inline-flex min-h-11 items-center text-fg-muted no-underline hover:text-fg hover:underline md:min-h-9"
          >
            {t("reset")}
          </Link>
        )}
        {isPending && (
          <span role="status" className="text-fg-muted">
            {t("loading")}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * A native select laid over the word it changes, so the sentence keeps its
 * width while phones still get their own picker.
 */
function SelectField({
  label,
  text,
  value,
  onChange,
  children,
}: {
  label: string;
  text: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <span className={field}>
      <span aria-hidden>{text}</span>
      <ChevronDown aria-hidden strokeWidth={1.75} className="size-4 text-fg-muted" />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full cursor-pointer appearance-none opacity-0"
      >
        {children}
      </select>
    </span>
  );
}

function DateRangeField({
  state,
  today,
  label,
  onApply,
}: {
  state: CalendarFilterState;
  today: string;
  label: string;
  onApply: (from: string, to: string) => void;
}) {
  const t = useTranslations("calendar.filters");
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(state.from ?? today);
  const [to, setTo] = useState(state.to ?? "");
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setFrom(state.from ?? today);
          setTo(state.to ?? "");
        }
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" className={cn(field, "tabular text-link")} aria-label={t("datesLabel", { date: label })}>
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] rounded-none border-fg p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            setOpen(false);
            onApply(from, to);
          }}
        >
          <p className="font-semibold">{t("dates")}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-fg-muted">
              {t("from")}
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 block h-11 w-full border border-border bg-surface px-2 text-base text-fg tabular"
              />
            </label>
            <label className="text-xs font-medium text-fg-muted">
              {t("to")}
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 block h-11 w-full border border-border bg-surface px-2 text-base text-fg tabular"
              />
            </label>
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 text-sm">
            {PRESETS.map((preset) => {
              const range = presetRange(preset, today);
              return (
                <li key={preset}>
                  <Link
                    href={calendarHref({ ...state, ...range, page: 1, order: defaultOrder(range.from, new Date(`${today}T12:00:00Z`)) })}
                    scroll={false}
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-11 items-center md:min-h-9"
                  >
                    {t(`presets.${preset}`, { year: today.slice(0, 4) })}
                  </Link>
                </li>
              );
            })}
            {(state.from || state.to) && (
              <li>
                <Link
                  href={calendarHref({ ...state, from: undefined, to: undefined, page: 1, order: "asc" })}
                  scroll={false}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center md:min-h-9"
                >
                  {t("presets.onward")}
                </Link>
              </li>
            )}
          </ul>
          <button
            type="submit"
            disabled={!valid}
            className="mt-3 h-11 w-full bg-fg font-semibold text-bg disabled:opacity-50"
          >
            {t("showRaces")}
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function MoreFilters({
  state,
  cups,
  count,
  onChange,
}: {
  state: CalendarFilterState;
  cups: Option[];
  count: number;
  onChange: (patch: Partial<CalendarFilterState>) => void;
}) {
  const t = useTranslations("calendar.filters");
  const toggles: { key: "rproof" | "norslt" | "splits"; label: string }[] = [
    { key: "rproof", label: t("rankingEligible") },
    { key: "norslt", label: t("withoutResults") },
    { key: "splits", label: t("hideSplits") },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex min-h-11 items-center gap-1.5 text-fg hover:underline md:min-h-9">
          <SlidersHorizontal aria-hidden strokeWidth={1.75} className="size-4" />
          {count > 0 ? t("moreCount", { count }) : t("more")}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] rounded-none border-fg p-4">
        <fieldset className="grid gap-1">
          <legend className="label-caps mb-1 text-fg-muted">{t("more")}</legend>
          {toggles.map(({ key, label }) => (
            <label key={key} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm md:min-h-9">
              <input
                type="checkbox"
                checked={state[key]}
                onChange={(e) => onChange({ [key]: e.target.checked })}
                className="size-4 accent-[var(--fg)]"
              />
              {label}
            </label>
          ))}
          {cups.length > 0 && (
            <label className="mt-2 text-xs font-medium text-fg-muted">
              {t("cup")}
              <select
                value={state.cups}
                onChange={(e) => onChange({ cups: e.target.value })}
                className="mt-1 block h-11 w-full border border-border bg-surface px-2 text-sm text-fg"
              >
                <option value="all">{t("allCups")}</option>
                {cups.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}
