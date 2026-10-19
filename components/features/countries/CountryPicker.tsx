"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CountryOption } from "./data";

interface CountryPickerProps {
  /** The country now shown. */
  value?: string;
  countries: CountryOption[];
  label: string;
  searchLabel: string;
  emptyLabel: string;
  className?: string;
}

/** "Another country": a searchable list (name or code) that opens that country's page. */
export function CountryPicker({ value, countries, label, searchLabel, emptyLabel, className }: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            "inline-flex min-h-11 items-center gap-2 border-b border-border text-sm text-fg-muted hover:border-fg hover:text-fg md:min-h-9",
            className
          )}
        >
          <Search aria-hidden strokeWidth={1.75} className="size-4" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchLabel} aria-label={searchLabel} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {countries.map((c) => (
                <CommandItem
                  key={c.value}
                  value={`${c.value} ${c.label}`}
                  onSelect={() => {
                    setOpen(false);
                    if (c.value !== value) router.push(`/countries/${c.value}`);
                  }}
                >
                  <Check
                    aria-hidden
                    strokeWidth={1.75}
                    className={cn("me-2 size-4", value === c.value ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{c.label}</span>
                  <span className="ms-auto ps-2 text-xs text-fg-muted tabular">{c.value}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
