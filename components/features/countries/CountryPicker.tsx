"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CountryOption } from "./data";

interface CountryPickerProps {
  value?: string;
  countries: CountryOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
}

/** Searchable country select; matches on code and name. */
export function CountryPicker({
  value,
  countries,
  onSelect,
  placeholder = "Choose country",
}: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = countries.find((c) => c.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] justify-between h-10"
        >
          <span className="flex items-center truncate font-medium">
            <Globe className="mr-2 h-4 w-4 shrink-0" />
            {selected ? `${selected.label} (${selected.value})` : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((c) => (
                <CommandItem
                  key={c.value}
                  value={`${c.value} ${c.label}`}
                  onSelect={() => {
                    onSelect(c.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === c.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{c.label}</span>
                  <span className="ml-auto pl-2 text-xs text-muted-foreground">
                    {c.value}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
