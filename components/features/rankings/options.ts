// Helpers for turning the DUV API's parallel Flt*Values / Flt*Labels arrays
// into select options. Safe to import from server and client components.

export interface FilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function zipOptions(
  values: (string | number)[] | undefined,
  labels?: string[],
): FilterOption[] {
  if (!values) return [];
  return values.map((value, i) => {
    const v = String(value);
    // The API uses "---" as a visual separator inside country lists
    if (v === "---")
      return { value: `---${i}`, label: "──────", disabled: true };
    return { value: v, label: labels?.[i] ?? v };
  });
}

/** The API's gender labels are lower case ("all", "men", "women"). */
export function capitalizeLabels(options: FilterOption[]) {
  return options.map((o) => ({
    ...o,
    label: o.label.charAt(0).toUpperCase() + o.label.slice(1),
  }));
}

/** Keeps the current URL value selectable even if the API list lacks it. */
export function withCurrentValue(options: FilterOption[], value: string) {
  if (!options.length || options.some((o) => o.value === value)) return options;
  return [{ value, label: value }, ...options];
}

export function yearOptions(years: (string | number)[] | undefined) {
  return zipOptions(years).map((o) =>
    o.value === "all" ? { ...o, label: "All-time" } : o,
  );
}

/** FltAgeCat has no "all" entry and may contain "#NA" for unknown categories. */
export function ageCatOptions(cats: string[] | undefined): FilterOption[] {
  if (!cats?.length) return [];
  return [
    { value: "all", label: "All" },
    ...cats.filter((c) => c !== "#NA").map((c) => ({ value: c, label: c })),
  ];
}

type SearchParams = { [key: string]: string | string[] | undefined };

export function getParam(params: SearchParams, name: string, fallback: string) {
  const value = params[name];
  return typeof value === "string" && value !== "" ? value : fallback;
}

export function getPage(params: SearchParams) {
  const page = Number(getParam(params, "page", "1"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}
