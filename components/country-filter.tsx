// components/country-filter.tsx
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
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
import { Label } from "@/components/ui/label";

interface Country {
  value: string;
  label: string;
  searchTerms: string;
}

interface CountryFilterProps {
  country: string;
  onCountryChange: (value: string) => void;
}

export function CountryFilter({
  country,
  onCountryChange,
}: CountryFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [countries, setCountries] = React.useState<Country[]>([]);

  React.useEffect(() => {
    async function fetchCountries() {
      try {
        const response = await fetch("/api/countries");
        if (!response.ok) {
          throw new Error(`Failed to fetch countries: ${response.status}`);
        }
        const data = await response.json();
        setCountries(data);
      } catch (err) {
        console.error(err);
        setCountries([]);
      }
    }

    fetchCountries();
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="country">Country</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full sm:w-[180px] justify-between"
          >
            {country
              ? countries.find((c) => c.value === country)?.label
              : "Select country..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countries.map((c) => (
                  <CommandItem
                    key={c.value}
                    value={c.searchTerms}
                    onSelect={() => {
                      onCountryChange(c.value === country ? "" : c.value);
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
    </div>
  );
}
