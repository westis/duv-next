"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import type { CountryOption } from "./data";

interface CountryDirectoryProps {
  countries: CountryOption[];
  /** Section each country links to. */
  section: "records" | "abroad";
}

export function CountryDirectory({
  countries,
  section,
}: CountryDirectoryProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.value.toLowerCase().includes(q) || c.label.toLowerCase().includes(q),
    );
  }, [countries, query]);

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Search country..."
        aria-label="Search country"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm h-10"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No country found.</p>
      ) : (
        <ul className="grid gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((c) => (
            <li key={c.value}>
              <Link
                href={`/countries/${c.value}/${section}`}
                className="nav-link flex items-center justify-between rounded-md px-3 py-2"
              >
                <span>{c.label}</span>
                <span className="text-xs text-muted-foreground">{c.value}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
