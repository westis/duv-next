"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { searchHref, type SearchQuery, type SearchType } from "./params";

export interface CountryOption {
  value: string;
  label: string;
}

const inline =
  "border-0 border-b bg-transparent px-1 text-fg outline-none focus-visible:border-b-2 focus-visible:border-brand";

/**
 * The /search form as one sentence (direction A): "Search [sparta] in
 * [runners and races] from [any country], distance [any]". Every blank is a
 * real labelled control; the sentence is only how they are laid out.
 */
export function SearchSentence({ query, countries }: { query: SearchQuery; countries: CountryOption[] }) {
  const t = useTranslations("search.form");
  const router = useRouter();
  // The page keys this component by URL, so it resets on navigation.
  const [form, setForm] = useState(query);
  const update = <K extends keyof SearchQuery>(key: K, value: SearchQuery[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push(searchHref({ ...form, sname: form.sname.trim(), page: 1, rpage: 1 }));
  };

  const runners = form.type !== "event";
  const races = form.type !== "runner";

  return (
    <form role="search" onSubmit={onSubmit} className="pt-5 md:pt-7">
      <p className="text-[1.0625rem] leading-[2.1] text-fg-muted md:text-[1.375rem] md:leading-[1.9]">
        <label htmlFor="search-term">{t("search")}</label>{" "}
        <input
          id="search-term"
          type="search"
          autoFocus={!query.sname}
          value={form.sname}
          onChange={(e) => update("sname", e.target.value)}
          placeholder={t("termPlaceholder")}
          enterKeyHint="search"
          className={`${inline} w-[11rem] border-b-2 border-fg font-semibold md:w-[15rem] [&::-webkit-search-cancel-button]:hidden`}
        />{" "}
        <label htmlFor="search-type">{t("in")}</label>{" "}
        <select
          id="search-type"
          value={form.type}
          onChange={(e) => update("type", e.target.value as SearchType)}
          className={`${inline} border-dashed border-fg-muted font-medium [&_option]:bg-bg [&_option]:text-fg`}
        >
          <option value="all">{t("typeAll")}</option>
          <option value="runner">{t("typeRunner")}</option>
          <option value="event">{t("typeEvent")}</option>
        </select>{" "}
        <label htmlFor="search-nat">{t("from")}</label>{" "}
        <select
          id="search-nat"
          value={form.nat}
          onChange={(e) => update("nat", e.target.value)}
          className={`${inline} max-w-[12rem] border-dashed border-fg-muted font-medium [&_option]:bg-bg [&_option]:text-fg`}
        >
          <option value="">{t("anyCountry")}</option>
          {countries.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {races && (
          <>
            {", "}
            <label htmlFor="search-dist">{t("distance")}</label>{" "}
            <input
              id="search-dist"
              value={form.dist}
              onChange={(e) => update("dist", e.target.value)}
              placeholder={t("anyDistance")}
              className={`${inline} w-[5.5rem] border-dashed border-fg-muted font-medium placeholder:text-fg-muted`}
            />
          </>
        )}{" "}
        <button
          type="submit"
          className="ms-1 inline-flex size-11 translate-y-[-1px] items-center justify-center rounded-sm bg-fg align-middle text-bg hover:bg-fg/85"
          aria-label={t("submit")}
        >
          <Search className="size-5" strokeWidth={1.75} aria-hidden />
        </button>
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-fg-muted">
        {runners && (
          <>
            <label className="inline-flex min-h-11 items-center gap-2 md:min-h-9">
              <input
                type="checkbox"
                checked={form.exact}
                onChange={(e) => update("exact", e.target.checked)}
                className="size-4 accent-[var(--fg)]"
              />
              {t("exact")}
            </label>
            <label className="inline-flex min-h-11 items-center gap-2 md:min-h-9">
              <input
                type="checkbox"
                checked={form.fuzzy}
                onChange={(e) => update("fuzzy", e.target.checked)}
                className="size-4 accent-[var(--fg)]"
              />
              {t("fuzzy")}
            </label>
          </>
        )}
        <span>{runners ? t("runnerHelp") : t("raceHelp")}</span>
      </div>
    </form>
  );
}
