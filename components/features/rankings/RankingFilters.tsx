"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountrySelectFilter } from "@/components/filters/CountrySelectFilter";
import { withCurrentValue, type FilterOption } from "./options";

export interface RankingFilter {
  /** URL / API parameter name */
  name: string;
  label: string;
  value: string;
  options: FilterOption[];
  /** Render as a searchable country picker */
  country?: boolean;
}

export function RankingFilters({ filters }: { filters: RankingFilter[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParam = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div
      className="flex flex-wrap items-end gap-4 mb-6 data-[pending=true]:opacity-60 transition-opacity"
      data-pending={isPending}
      aria-busy={isPending}
    >
      {filters
        .filter((f) => f.options.length > 0)
        .map((filter) => (
          <div key={filter.name} className="flex flex-col gap-1.5">
            <Label htmlFor={`filter-${filter.name}`}>{filter.label}</Label>
            {filter.country ? (
              <CountrySelectFilter
                country={filter.value}
                onCountryChange={(value) => setParam(filter.name, value)}
                placeholder={
                  filter.options.find((o) => o.value === "all")?.label ??
                  "All countries"
                }
                countries={filter.options.filter(
                  (o) => !o.disabled && o.value !== "all",
                )}
                isLoading={false}
              />
            ) : (
              <Select
                value={filter.value}
                onValueChange={(value) => setParam(filter.name, value)}
              >
                <SelectTrigger
                  id={`filter-${filter.name}`}
                  className="w-[140px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {withCurrentValue(filter.options, filter.value).map(
                    (option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
    </div>
  );
}
