/** A valid BCP-47 tag for Intl, or "en" when the given one is malformed. */
export function resolveLocale(locale: string | null | undefined): string {
  if (!locale) return "en";
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? "en";
  } catch {
    return "en";
  }
}

/** The language subtag: "zh-Hant-TW" -> "zh". */
export function languageOf(locale: string): string {
  return resolveLocale(locale).split("-")[0].toLowerCase();
}

/** DUV sends a literal "&nbsp;" (or whitespace) for empty fields. */
export function cleanDuv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}
