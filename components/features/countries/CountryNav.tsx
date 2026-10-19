"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CountryPicker } from "./CountryPicker";
import type { CountryOption } from "./data";

const SECTIONS = [
  { slug: "records", label: "National records" },
  { slug: "abroad", label: "Top rankings abroad" },
];

interface CountryNavProps {
  nat: string;
  countries: CountryOption[];
}

export function CountryNav({ nat, countries }: CountryNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const current =
    SECTIONS.find((s) => pathname.endsWith(`/${s.slug}`))?.slug ?? "records";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <nav
        aria-label="Country statistics"
        className="inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground"
      >
        {SECTIONS.map((section) => (
          <Link
            key={section.slug}
            href={`/countries/${nat}/${section.slug}`}
            aria-current={current === section.slug ? "page" : undefined}
            className={cn(
              "nav-link inline-flex items-center rounded-sm px-3 py-1.5 text-sm font-medium",
              current === section.slug && "bg-background shadow-xs",
            )}
          >
            {section.label}
          </Link>
        ))}
      </nav>
      <CountryPicker
        value={nat}
        countries={countries}
        onSelect={(value) => {
          if (value !== nat) router.push(`/countries/${value}/${current}`);
        }}
      />
    </div>
  );
}
