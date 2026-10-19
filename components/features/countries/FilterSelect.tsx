"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FilterSelectProps {
  /** URL query parameter this select controls. */
  param: string;
  label: string;
  value: string;
  /** Value that means "no filter"; it is removed from the URL. */
  defaultValue: string;
  /** Empty values are rendered as separators. */
  options: { value: string; label: string }[];
  className?: string;
}

export function FilterSelect({
  param,
  label,
  value,
  defaultValue,
  options,
  className,
}: FilterSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const id = `filter-${param}`;

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === defaultValue) params.delete(param);
    else params.set(param, next);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className={cn("w-[160px]", isPending && "opacity-60")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, i) =>
            option.value === "" ? (
              <SelectSeparator key={`sep-${i}`} />
            ) : (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
