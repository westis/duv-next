"use client";

import { useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MarkerKind = "WR" | "AR" | "NR" | "CR" | "PB";

export interface RecordMarkerProps {
  kind: MarkerKind;
  /** Age class after the code: "M50" gives "NR M50". */
  category?: string;
  /**
   * Ratifying body when the mark beats the ratified record but a better
   * unratified mark stands above it ("IAU AR", outlined).
   */
  body?: "IAU" | "GOMU";
  /** Popover text: what it is, where it comes from, how far to trust it. */
  children: ReactNode;
  className?: string;
}

const solid: Record<MarkerKind, string> = {
  WR: "bg-brand text-brand-fg border-brand",
  AR: "bg-brand text-brand-fg border-brand",
  NR: "bg-brand text-brand-fg border-brand",
  CR: "bg-cr text-surface border-cr",
  PB: "bg-transparent text-pb border-pb",
};

/**
 * Compact record marker placed right after a performance (design spec,
 * "Record markers"). Opens on hover with a fine pointer and on tap or Enter.
 */
export function RecordMarker({ kind, category, body, children, className }: RecordMarkerProps) {
  const [open, setOpen] = useState(false);
  const label = [body, kind, category].filter(Boolean).join(" ");
  const hoverable = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex h-[18px] items-center border px-1 text-[11px] leading-none font-semibold tracking-[0.04em] uppercase tabular",
          body ? "border-brand bg-transparent text-brand" : solid[kind],
          className
        )}
        onMouseEnter={() => hoverable() && setOpen(true)}
        onMouseLeave={() => hoverable() && setOpen(false)}
      >
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm leading-normal" side="top">
        {children}
      </PopoverContent>
    </Popover>
  );
}
