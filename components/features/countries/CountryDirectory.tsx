"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { CONTINENT_ORDER, continentOf, type Continent } from "./continents";
import type { CountryOption } from "./data";

/** Folds accents and case so "cote" finds "Côte d'Ivoire". */
function fold(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * The countries index, Almanac look: a book-style list in continent columns,
 * code then name, filtered as you type a name or IOC code. Enter opens the
 * country when one is left (or the code matches exactly).
 */
export function CountryDirectory({ countries }: { countries: CountryOption[] }) {
  const t = useTranslations("countries");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputId = useId();
  const statusId = useId();

  const q = fold(query.trim());
  const filtered = useMemo(
    () => (q ? countries.filter((c) => fold(c.value).includes(q) || fold(c.label).includes(q)) : countries),
    [countries, q]
  );
  const groups = useMemo(() => {
    const byContinent = new Map<Continent, CountryOption[]>();
    for (const c of filtered) {
      const continent = continentOf(c.value);
      byContinent.set(continent, [...(byContinent.get(continent) ?? []), c]);
    }
    return CONTINENT_ORDER.flatMap((continent) => {
      const list = byContinent.get(continent);
      return list?.length ? [{ continent, list }] : [];
    });
  }, [filtered]);

  const exact = filtered.find((c) => c.value.toLowerCase() === query.trim().toLowerCase());
  const target = exact ?? (filtered.length === 1 ? filtered[0] : undefined);

  return (
    <div>
      <form
        role="search"
        className="mt-4 max-w-md"
        onSubmit={(event) => {
          event.preventDefault();
          if (target) router.push(`/countries/${target.value}`);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          {t("directory.filterLabel")}
        </label>
        <div className="flex h-11 items-center gap-2 border-b border-fg">
          <Search aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-fg-muted" />
          <input
            id={inputId}
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder={t("directory.filterPlaceholder")}
            aria-describedby={statusId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-muted"
          />
        </div>
      </form>
      <p id={statusId} role="status" className="mt-2 text-xs text-fg-muted md:text-sm">
        {q ? (filtered.length ? t("directory.matches", { count: filtered.length }) : t("directory.noMatch", { query: query.trim() })) : ""}
      </p>

      <div className="mt-2 gap-x-9 sm:columns-2 lg:columns-3 xl:columns-4">
        {groups.map(({ continent, list }) => (
          <section
            key={continent}
            id={continent}
            aria-labelledby={`${continent}-heading`}
            className="mb-6 break-inside-avoid-column"
          >
            <h2
              id={`${continent}-heading`}
              className="label-caps flex items-baseline justify-between border-b-[length:var(--rule-mid)] border-fg pb-1.5"
            >
              {t(`continents.${continent}`)}
              <span className="font-normal text-fg-muted tabular">{list.length}</span>
            </h2>
            <ul>
              {list.map((c) => (
                <li key={c.value}>
                  <Link
                    href={`/countries/${c.value}`}
                    className="nav-link flex min-h-11 items-baseline gap-2 border-b border-hair py-2.5 hover:bg-transparent hover:underline sm:min-h-7 sm:border-b-0 sm:py-1"
                  >
                    <span className="inline-block w-9 shrink-0 text-xs font-semibold tracking-[0.03em] text-fg-muted tabular">
                      {c.value}
                    </span>
                    <span>{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
