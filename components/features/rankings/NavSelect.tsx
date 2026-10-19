"use client";

import { useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavOption {
  value: string;
  label: string;
  /** Where choosing this option goes. Separators have none. */
  href?: string;
}

/**
 * A native select whose options are links: choosing one opens that URL, so the
 * filter stays in the query string. For long lists (age groups, countries,
 * years) where a list of links would be too long for the rail.
 */
export function NavSelect({
  label,
  value,
  options,
  className,
}: {
  label: string;
  value: string;
  options: NavOption[];
  className?: string;
}) {
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const known = options.some((o) => o.value === value);

  return (
    <div className={cn("flex flex-col gap-1", className)} aria-busy={pending || undefined}>
      <label htmlFor={id} className="label-caps text-fg-muted">
        {label}
      </label>
      <span className="relative flex">
        <select
          key={value}
          id={id}
          defaultValue={known ? value : undefined}
          onChange={(event) => {
            const href = options.find((o) => o.value === event.target.value)?.href;
            if (href) startTransition(() => router.push(href, { scroll: false }));
          }}
          className={cn(
            "h-11 w-full appearance-none border border-border bg-bg ps-3 pe-8 text-base text-fg hover:border-fg-muted md:h-9 md:text-sm",
            pending && "opacity-60"
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={!option.href}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          strokeWidth={1.75}
          className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
        />
      </span>
    </div>
  );
}
