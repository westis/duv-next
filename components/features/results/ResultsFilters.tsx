"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PER_PAGE_OPTIONS,
  resultsQueryString,
  type FilterOption,
  type ResultsQuery,
} from "./params";

interface ResultsFiltersProps {
  query: ResultsQuery;
  catTypeOptions: FilterOption[];
  catOptions: FilterOption[];
  countryOptions: FilterOption[];
  speedOptions: FilterOption[];
  labels: {
    catType: string;
    cat: string;
    country: string;
    speed: string;
    perPage: string;
  };
}

const ALL = "all";

export function ResultsFilters({
  query,
  catTypeOptions,
  catOptions,
  countryOptions,
  speedOptions,
  labels,
}: ResultsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Every filter change goes back to page 1.
  function update(patch: Partial<ResultsQuery>) {
    const next = { ...query, ...patch, page: 1 };
    startTransition(() => {
      router.push(`${pathname}${resultsQueryString(next)}`, { scroll: false });
    });
  }

  const fromAll = (value: string) => (value === ALL ? undefined : value);

  return (
    <div className="flex flex-wrap items-end gap-4 py-4">
      {catTypeOptions.length > 0 && (
        <FilterSelect
          id="aktype"
          label={labels.catType}
          value={String(query.aktype ?? 2)}
          options={catTypeOptions}
          // Category codes differ per category type, so reset the category.
          onChange={(v) => update({ aktype: Number(v), cat: undefined })}
        />
      )}
      {catOptions.length > 0 && (
        <FilterSelect
          id="cat"
          label={labels.cat}
          value={query.cat ?? ALL}
          options={catOptions}
          onChange={(v) => update({ cat: fromAll(v) })}
        />
      )}
      {countryOptions.length > 0 && (
        <FilterSelect
          id="country"
          label={labels.country}
          value={query.country ?? ALL}
          options={countryOptions}
          onChange={(v) => update({ country: fromAll(v) })}
        />
      )}
      {speedOptions.length > 0 && (
        <FilterSelect
          id="speed"
          label={labels.speed}
          value={String(query.speed ?? 1)}
          options={speedOptions}
          onChange={(v) => update({ speed: Number(v) })}
        />
      )}
      <FilterSelect
        id="perpage"
        label={labels.perPage}
        value={String(query.perpage)}
        options={PER_PAGE_OPTIONS.map((n) => ({
          value: String(n),
          label: String(n),
        }))}
        onChange={(v) => update({ perpage: Number(v) })}
        className="w-[90px]"
      />
      {isPending && (
        <Loader2
          className="mb-2 h-5 w-5 animate-spin text-yellow-500"
          aria-label="Loading"
        />
      )}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
  className = "w-[160px]",
}: {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  // The API's current value can be missing from its own list; keep it selectable.
  const items = options.some((o) => o.value === value)
    ? options
    : [{ value, label: value }, ...options];

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className={className}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
