import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CountryFilterProps {
  country: string;
  onCountryChange: (value: string) => void;
  placeholder: string;
}

export function CountrySelectFilter({
  country,
  onCountryChange,
  placeholder,
}: CountryFilterProps) {
  return (
    <Select value={country} onValueChange={onCountryChange}>
      <SelectTrigger className="w-[180px] h-10 font-medium">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Events</SelectItem>
        {/* Add other event type options here */}
      </SelectContent>
    </Select>
  );
}
