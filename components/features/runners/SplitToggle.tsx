"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "+ 3 splits": unfolds the split rows of its race. The rows are server
 * rendered in the same `<tbody>` and hidden by its `data-open`, so they are
 * in the page before this script runs; the button flips that attribute.
 */
export function SplitToggle({
  defaultOpen,
  showLabel,
  hideLabel,
}: {
  defaultOpen: boolean;
  showLabel: string;
  hideLabel: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={(event) => {
        const next = !open;
        setOpen(next);
        const body = event.currentTarget.closest("tbody");
        if (body) body.dataset.open = String(next);
      }}
      className="inline-flex min-h-11 items-center gap-1 text-xs text-link hover:underline md:min-h-6 md:text-[0.8125rem]"
    >
      <ChevronDown aria-hidden strokeWidth={1.75} className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      {open ? hideLabel : showLabel}
    </button>
  );
}
