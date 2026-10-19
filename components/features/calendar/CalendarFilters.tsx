"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Filter,
  SortAsc,
  SortDesc,
  Trophy,
  X,
} from "lucide-react";
import { DateRangePicker } from "@/components/DateRangePicker";
import { CountrySelectFilter } from "@/components/filters/CountrySelectFilter";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarFilterState,
  Option,
  OptionGroup,
  calendarHref,
  defaultOrder,
  parseCalendarParams,
} from "./params";

export interface CalendarFilterOptions {
  distances: OptionGroup[];
  countries: Option[];
  cups: Option[];
}

interface CalendarFiltersProps {
  state: CalendarFilterState;
  options: CalendarFilterOptions;
}

export function CalendarFilters({ state, options }: CalendarFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Any filter change goes back to page 1; the server page re-renders from the URL.
  const update = (patch: Partial<CalendarFilterState>) => {
    const next = { ...state, page: 1, ...patch };
    startTransition(() => router.push(calendarHref(next), { scroll: false }));
  };

  // The one date filter: a range, or none for "from today onward".
  const changeRange = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) {
      update({ from: undefined, to: undefined, order: defaultOrder() });
      return;
    }
    const from = format(range.from, "yyyy-MM-dd");
    const to = format(range.to, "yyyy-MM-dd");
    update({ from, to, order: defaultOrder(from) });
  };

  const hasRange = !!(state.from && state.to);
  // Stable Date objects: the picker resets its draft whenever these change.
  const rangeFrom = useMemo(
    () => (state.from ? parseISO(state.from) : undefined),
    [state.from],
  );
  const rangeTo = useMemo(
    () => (state.to ? parseISO(state.to) : undefined),
    [state.to],
  );
  const defaults = parseCalendarParams({});
  const isFiltered =
    hasRange ||
    state.dist !== "all" ||
    state.country !== "all" ||
    state.cups !== "all" ||
    state.rproof ||
    state.norslt ||
    state.splits ||
    state.iau;
  const moreCount = [
    state.rproof,
    state.norslt,
    state.splits,
    state.iau,
  ].filter(Boolean).length;

  return (
    <div
      className="flex flex-wrap items-center gap-3 mb-6"
      aria-busy={isPending}
      data-pending={isPending ? "" : undefined}
    >
      <div className="font-medium">
        <DateRangePicker
          initialDateFrom={rangeFrom}
          initialDateTo={rangeTo}
          onUpdate={changeRange}
        />
      </div>

      <Select value={state.dist} onValueChange={(dist) => update({ dist })}>
        <SelectTrigger
          className="w-[180px] h-10 font-medium"
          aria-label="Distance or race type"
        >
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="All distances" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All distances</SelectItem>
          {options.distances.map((group, i) => (
            <SelectGroup key={i}>
              <SelectSeparator />
              {group.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      <CountrySelectFilter
        country={state.country}
        onCountryChange={(country) => update({ country })}
        placeholder="All countries"
        countries={options.countries}
        isLoading={false}
      />

      {options.cups.length > 0 && (
        <Select value={state.cups} onValueChange={(cups) => update({ cups })}>
          <SelectTrigger
            className="w-[180px] h-10 font-medium"
            aria-label="Cup"
          >
            <Trophy className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All cups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cups</SelectItem>
            {options.cups.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-10">
            More filters{moreCount > 0 && ` (${moreCount})`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="grid gap-3">
            <ToggleRow
              id="cal-iau"
              label="IAU label races only"
              checked={state.iau}
              onChange={(iau) => update({ iau })}
            />
            <ToggleRow
              id="cal-rproof"
              label="Ranking eligible only"
              checked={state.rproof}
              onChange={(rproof) => update({ rproof })}
            />
            <ToggleRow
              id="cal-norslt"
              label="Without results only"
              checked={state.norslt}
              onChange={(norslt) => update({ norslt })}
            />
            <ToggleRow
              id="cal-splits"
              label="Hide splits and stages"
              checked={state.splits}
              onChange={(splits) => update({ splits })}
            />
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        className="h-10 px-3"
        onClick={() =>
          update({ order: state.order === "asc" ? "desc" : "asc" })
        }
        aria-label={
          state.order === "asc" ? "Sorted oldest first" : "Sorted newest first"
        }
      >
        {state.order === "asc" ? (
          <SortAsc className="h-4 w-4 mr-2" />
        ) : (
          <SortDesc className="h-4 w-4 mr-2" />
        )}
        {state.order === "asc" ? "Earliest first" : "Latest first"}
      </Button>

      {isFiltered && (
        <Button
          variant="ghost"
          className="h-10 px-3"
          onClick={() => update({ ...defaults, perpage: state.perpage })}
        >
          <X className="h-4 w-4 mr-1" /> Reset
        </Button>
      )}

      {isPending && (
        <span className="text-sm text-muted-foreground" role="status">
          Loading…
        </span>
      )}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-sm font-medium leading-none">
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
