import "server-only";

import { notFound } from "next/navigation";
import { getCalendar } from "@/lib/duv";

export interface CountryOption {
  value: string;
  label: string;
}

/** Country list from the calendar's filter values; cached for a day. */
export async function getCountryOptions(): Promise<CountryOption[]> {
  try {
    const data = await getCalendar({ perpage: 1 }, { revalidate: 86400 });
    const values = data?.FltCountryValues ?? [];
    const labels = data?.FltCountryLabels ?? [];
    return values
      .map((value, i) => ({ value, label: labels[i] ?? value }))
      .filter((c) => c.value && c.value !== "all");
  } catch (error) {
    console.error("[countries] failed to load country list", error);
    return [];
  }
}

/** Returns the upper-case country code from a route param, or 404s. */
export function parseNat(nat: string) {
  if (!/^[a-z]{3}$/i.test(nat)) notFound();
  return nat.toUpperCase();
}

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Zips DUV `Flt*Value`/`Flt*Label` arrays. Empty values (shown as
 * "----------" by DUV) become separators.
 */
export function zipOptions(
  values: (string | number)[] | undefined,
  labels: string[] | undefined,
  fallback: SelectOption[],
): SelectOption[] {
  if (!values?.length) return fallback;
  return values.map((value, i) => ({
    value: String(value),
    label: labels?.[i] ?? String(value),
  }));
}
