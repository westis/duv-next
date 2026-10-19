import { cleanDuv, resolveLocale } from "./locale";

export interface RunnerName {
  first?: string | null;
  last?: string | null;
}

/** "Ondrej POUC": given name, then the surname uppercased for the locale. */
export function formatRunnerName(name: RunnerName, locale: string): string {
  const first = cleanDuv(name.first);
  const last = cleanDuv(name.last).toLocaleUpperCase(resolveLocale(locale));
  return [first, last].filter(Boolean).join(" ");
}

/** DUV's "Pouc, Ondrej" form. Without a comma the whole text is taken as the surname. */
export function parseDuvName(value: string | null | undefined): Required<RunnerName> {
  const s = cleanDuv(value);
  const comma = s.indexOf(",");
  if (comma < 0) return { first: "", last: s };
  return { first: s.slice(comma + 1).trim(), last: s.slice(0, comma).trim() };
}

/** "pouc, ondrej": a plain sort key by surname, for keys and simple sorts. */
export function runnerSortKey(name: RunnerName, locale: string): string {
  const loc = resolveLocale(locale);
  const last = cleanDuv(name.last).toLocaleLowerCase(loc);
  const first = cleanDuv(name.first).toLocaleLowerCase(loc);
  return first ? `${last}, ${first}` : last;
}

/** Compares by surname, then given name, with the locale's collation (accents sort right). */
export function compareRunnerNames(a: RunnerName, b: RunnerName, locale: string): number {
  const collator = new Intl.Collator(resolveLocale(locale), { sensitivity: "base" });
  return (
    collator.compare(cleanDuv(a.last), cleanDuv(b.last)) ||
    collator.compare(cleanDuv(a.first), cleanDuv(b.first))
  );
}
