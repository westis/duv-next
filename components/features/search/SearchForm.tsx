"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchHref, type SearchQuery } from "./params";

export interface CountryOption {
  value: string;
  label: string;
}

interface SearchFormProps {
  query: SearchQuery;
  countries: CountryOption[];
}

const ALL_COUNTRIES = "__all";

export function SearchForm({ query, countries }: SearchFormProps) {
  const router = useRouter();
  // The page keys this component by URL, so it resets on navigation
  const [form, setForm] = useState(query);

  const update = <K extends keyof SearchQuery>(key: K, value: SearchQuery[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push(searchHref({ ...form, page: 1 }));
  };

  const showRunnerFields = form.type === "runner";
  const showEventFields = form.type === "event";

  return (
    <form onSubmit={onSubmit} className="space-y-4" role="search">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-grow">
          <Label htmlFor="sname" className="sr-only">
            {showRunnerFields ? "Last name" : "Search term"}
          </Label>
          <Input
            id="sname"
            autoFocus={!query.sname}
            placeholder={
              showRunnerFields
                ? "Last name, or a PersonID"
                : showEventFields
                  ? "Event name, or an EventID"
                  : "Runner or event name, or an ID"
            }
            value={form.sname}
            onChange={(e) => update("sname", e.target.value)}
          />
        </div>
        <Button type="submit">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {showRunnerFields && (
          <div className="space-y-1">
            <Label htmlFor="fname">First name</Label>
            <Input
              id="fname"
              className="w-48"
              value={form.fname}
              onChange={(e) => update("fname", e.target.value)}
            />
          </div>
        )}

        {showEventFields && (
          <div className="space-y-1">
            <Label htmlFor="dist">Distance</Label>
            <Input
              id="dist"
              className="w-32"
              placeholder="e.g. 100km, 24h"
              value={form.dist}
              onChange={(e) => update("dist", e.target.value)}
            />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="nat">Country</Label>
          {countries.length > 0 ? (
            <Select
              value={form.nat || ALL_COUNTRIES}
              onValueChange={(v) => update("nat", v === ALL_COUNTRIES ? "" : v)}
            >
              <SelectTrigger id="nat" className="w-56">
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_COUNTRIES}>All countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="nat"
              className="w-24 uppercase"
              placeholder="GER"
              maxLength={3}
              value={form.nat}
              onChange={(e) => update("nat", e.target.value.toUpperCase())}
            />
          )}
        </div>

        {showRunnerFields && (
          <>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="exact"
                checked={form.exact}
                onCheckedChange={(v) => update("exact", v === true)}
              />
              <Label htmlFor="exact">Exact last name</Label>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="fuzzy"
                checked={form.fuzzy}
                onCheckedChange={(v) => update("fuzzy", v === true)}
              />
              <Label htmlFor="fuzzy">Similar spellings</Label>
            </div>
          </>
        )}
      </div>
    </form>
  );
}
