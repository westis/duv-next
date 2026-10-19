"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ControlOption {
  value: string;
  label: string;
}

export interface ControlGroup {
  label?: string;
  options: ControlOption[];
}

export interface RecordControl {
  /** Query parameter, or "scope" for the scope switch (which may change the path). */
  param: string;
  label: string;
  value: string;
  groups: ControlGroup[];
  /** The value that needs no query parameter. */
  defaultValue: string;
}

/** Where a scope lives: the world and the continents on /records, a nation on its country page. */
export function scopeHref(scope: string, keep: URLSearchParams): string {
  const params = new URLSearchParams();
  const dist = keep.get("dist");
  if (dist) params.set("dist", dist);
  if (/^[A-Z]{3}$/.test(scope) && !["EUR", "ASI", "AFR", "NAM", "SAM", "OCE"].includes(scope)) {
    const qs = params.toString();
    return `/countries/${scope}/records${qs ? `?${qs}` : ""}`;
  }
  if (scope && scope !== "world") params.set("scope", scope);
  const qs = params.toString();
  return `/records${qs ? `?${qs}` : ""}`;
}

/**
 * The board's options as compact native selects drawn like `FilterBar`'s:
 * underlined text, a label above. Each writes the URL, so a view can be shared.
 * Without JavaScript the selects submit as a GET form to `action`.
 */
export function RecordControls({
  controls,
  action,
  label,
  submitLabel,
}: {
  controls: RecordControl[];
  action: string;
  /** Accessible name of the group. */
  label: string;
  submitLabel: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  const onChange = (control: RecordControl, value: string) => {
    const keep = new URLSearchParams(search.toString());
    let href: string;
    if (control.param === "scope") {
      href = scopeHref(value, keep);
    } else {
      if (value === control.defaultValue) keep.delete(control.param);
      else keep.set(control.param, value);
      const qs = keep.toString();
      href = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    }
    startTransition(() => router.push(href, { scroll: false }));
  };

  return (
    <form
      action={action}
      method="get"
      role="group"
      aria-label={label}
      aria-busy={pending || undefined}
      className="flex flex-wrap items-end gap-x-6 gap-y-3"
    >
      {controls.map((control) => {
        const id = `records-${control.param}`;
        return (
          <div key={control.param} className="flex flex-col">
            <label htmlFor={id} className="label-caps text-fg-muted">
              {control.label}
            </label>
            <span className="relative inline-flex">
              <select
                key={control.value}
                id={id}
                name={control.param}
                defaultValue={control.value}
                onChange={(event) => onChange(control, event.target.value)}
                className={cn(
                  "h-11 max-w-[15rem] appearance-none border-0 border-b border-fg bg-bg ps-0 pe-6 text-sm font-semibold text-fg hover:border-fg md:h-9",
                  pending && "opacity-70"
                )}
              >
                {control.groups.map((group, gi) =>
                  group.label ? (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </optgroup>
                  ) : (
                    group.options.map((o) => (
                      <option key={`${gi}-${o.value}`} value={o.value}>
                        {o.label}
                      </option>
                    ))
                  )
                )}
              </select>
              <ChevronDown
                aria-hidden
                strokeWidth={1.75}
                className="pointer-events-none absolute end-0.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
              />
            </span>
          </div>
        );
      })}
      <noscript>
        <button type="submit" className="h-9 border border-fg px-3 text-sm">
          {submitLabel}
        </button>
      </noscript>
    </form>
  );
}
