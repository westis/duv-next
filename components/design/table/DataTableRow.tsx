"use client";

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableRowProps {
  /** The row's `<td>` cells, rendered by DataTable (on the server when it can). */
  children: ReactNode;
  /** The `<dl>` of hidden columns; when absent the row has no disclosure. */
  details?: ReactNode;
  /** Hides the disclosure cell and the expanded row once every column fits ("md:hidden"). */
  disclosureClass?: string;
  /** Accessible name of the disclosure button ("Show details for Jane Doe"). */
  detailsLabel?: string;
  colSpan: number;
  highlight?: boolean;
  className?: string;
  cellClassName?: string;
}

/**
 * The only client part of a DataTable row: the mobile disclosure that shows
 * hidden columns, and scrolling the highlighted row into view.
 */
export function DataTableRow({
  children,
  details,
  disclosureClass,
  detailsLabel,
  colSpan,
  highlight,
  className,
  cellClassName,
}: DataTableRowProps) {
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const detailsId = useId();

  useEffect(() => {
    if (highlight) rowRef.current?.scrollIntoView({ block: "center" });
  }, [highlight]);

  // Tapping anywhere on the row toggles it, except on its own links and controls.
  const onRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (!details) return;
    if ((event.target as HTMLElement).closest("a, button, input, select, textarea, label")) return;
    if (window.getSelection()?.toString()) return;
    setOpen((value) => !value);
  };

  return (
    <>
      <tr
        ref={rowRef}
        onClick={details ? onRowClick : undefined}
        className={cn(className, details && "max-lg:cursor-pointer", open && "[&>td]:border-b-0")}
        data-highlight={highlight || undefined}
      >
        {children}
        {details && (
          <td className={cn(cellClassName, "w-11 p-0 text-end align-middle", disclosureClass)}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={detailsId}
              aria-label={detailsLabel}
              onClick={() => setOpen((value) => !value)}
              className="inline-flex size-11 items-center justify-center text-fg-muted hover:bg-surface-muted hover:text-fg"
            >
              <ChevronDown
                aria-hidden
                strokeWidth={1.75}
                className={cn("size-4 transition-transform", open && "rotate-180")}
              />
            </button>
          </td>
        )}
      </tr>
      {details && (
        <tr id={detailsId} hidden={!open} className={cn(disclosureClass, highlight && "bg-highlight")}>
          <td colSpan={colSpan} className={cn(cellClassName, "px-3 pt-0 pb-3")}>
            {details}
          </td>
        </tr>
      )}
    </>
  );
}
