import type { DuvLanguage } from "@/lib/duv/types";

/**
 * The eight languages the DUV API speaks. Only English has messages so far;
 * adding a language is a new `messages/<locale>.json` plus an entry here.
 * English stays at the root URL; the others will get a prefix (/de/...).
 */
export const locales = ["en", "de", "fr", "it", "es", "ru", "ja", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Locales with messages today. The rest fall back to English. */
export const activeLocales: readonly Locale[] = ["en"];

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** The DUV API `language` parameter for a UI locale. */
export function duvLanguage(locale: string): DuvLanguage {
  return (isLocale(locale) ? locale.toUpperCase() : "EN") as DuvLanguage;
}

/** Text direction, so right-to-left languages can be added without layout work. */
export function localeDirection(locale: string): "ltr" | "rtl" {
  return ["ar", "he", "fa", "ur"].includes(locale) ? "rtl" : "ltr";
}
