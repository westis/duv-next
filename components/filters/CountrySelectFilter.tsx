import React, { useState, useEffect } from "react";
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

interface RawCountry {
  value: string;
  label: string;
}

interface Country extends RawCountry {
  searchTerms: string;
}

interface CountrySelectFilterProps {
  country: string;
  onCountryChange: (value: string) => void;
  placeholder?: string;
}

export function CountrySelectFilter({
  country,
  onCountryChange,
  placeholder = "All Countries",
}: CountrySelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    async function fetchCountries() {
      try {
        const response = await fetch("/api/countries");
        if (!response.ok) {
          throw new Error(`Failed to fetch countries: ${response.status}`);
        }
        const data: RawCountry[] = await response.json();
        setCountries(
          data
            .filter((c) => c.value !== "all")
            .map((c) => ({
              ...c,
              searchTerms: `${c.label} ${c.value}`.toLowerCase(),
            }))
        );
      } catch (err) {
        console.error(err);
        setCountries([]);
      }
    }

    fetchCountries();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[180px] justify-between h-10"
        >
          <div className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            <span className="font-medium">
              {!country || country === "all"
                ? placeholder
                : countries.find((c) => c.value === country)?.label ||
                  placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onCountryChange("all");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    country === "all" ? "opacity-100" : "opacity-0"
                  )}
                />
                All Countries
              </CommandItem>
              {countries.map((c) => (
                <CommandItem
                  key={c.value}
                  value={c.searchTerms}
                  onSelect={() => {
                    onCountryChange(c.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      country === c.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {c.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
