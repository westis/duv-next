"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface YearSelectProps {
  /** Page the form submits to ("/countries/SWE"). */
  action: string;
  label: string;
  /** Button text of the no-JavaScript form. */
  applyLabel: string;
  value: number;
  years: number[];
}

/**
 * The year a country page summarises: a native select drawn as underlined
 * text. Changing it loads the page for that year; without JavaScript it is a
 * GET form with an apply button.
 */
export function YearSelect({ action, label, applyLabel, value, years }: YearSelectProps) {
  const router = useRouter();
  const id = useId();
  return (
    <form action={action} method="get" className="inline-flex items-center gap-2">
      <label htmlFor={id} className="label-caps text-fg-muted">
        {label}
      </label>
      <span className="relative inline-flex">
        <select
          key={value}
          id={id}
          name="year"
          defaultValue={String(value)}
          onChange={(event) => router.push(`${action}?year=${event.target.value}`)}
          className="h-11 appearance-none border-0 border-b border-fg bg-bg ps-0 pe-6 text-sm font-semibold text-fg tabular md:h-9"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          strokeWidth={1.75}
          className="pointer-events-none absolute end-0.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
        />
      </span>
      <noscript>
        <button type="submit" className="h-9 border border-fg px-3 text-sm">
          {applyLabel}
        </button>
      </noscript>
    </form>
  );
}
