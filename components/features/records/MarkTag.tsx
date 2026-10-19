"use client";

import { useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * The record board's marker after a mark: solid red for a ratified record (or
 * a national best, which national federations ratify), dashed and neutral
 * for a best in DUV's database that no body has ratified, or one that is
 * pending. Same size and popover behaviour as `RecordMarker`.
 */
export function MarkTag({
  label,
  variant,
  children,
  className,
}: {
  label: string;
  variant: "solid" | "dashed";
  /** Popover text: what the marker means and where it comes from. */
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const hoverable = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "relative inline-flex h-[18px] shrink-0 items-center after:absolute after:-inset-1.5 after:content-[''] border px-1 align-[1px] font-sans text-[11px] leading-none font-semibold tracking-[0.04em] tabular",
          variant === "solid"
            ? "border-brand bg-brand text-brand-fg uppercase"
            : "border-dashed border-fg-muted bg-transparent text-fg-muted lowercase",
          className
        )}
        onMouseEnter={() => hoverable() && setOpen(true)}
        onMouseLeave={() => hoverable() && setOpen(false)}
      >
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-1 text-sm leading-normal font-normal" side="top">
        {children}
      </PopoverContent>
    </Popover>
  );
}
