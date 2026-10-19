import type { RowData } from "@tanstack/react-table";

/** 1 = always visible, 2 = from md (768 px), 3 = from lg (1024 px). */
export type ColumnPriority = 1 | 2 | 3;

declare module "@tanstack/react-table" {
  // TanStack's declaration merging needs the same type parameters.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** When the column appears; hidden columns go into the expandable row. Default 1. */
    priority?: ColumnPriority;
    /** Numbers end-aligned (and tabular), text start-aligned. Default "start". */
    align?: "start" | "end";
    /** Label in the expanded mobile row when the header is not plain text. */
    mobileLabel?: string;
    /** Width in px. Required for sticky columns (their offsets add up), optional otherwise. */
    width?: number;
    /** Extra classes on every body cell of this column. */
    className?: string;
  }
}

/** Classes that hide a cell below the breakpoint its priority starts at. */
export const cellVisibility: Record<ColumnPriority, string> = {
  1: "",
  2: "hidden md:table-cell",
  3: "hidden lg:table-cell",
};

/** Classes that hide a label/value pair in the expanded row once its column is visible. */
export const detailVisibility: Record<ColumnPriority, string> = {
  1: "hidden",
  2: "md:hidden",
  3: "lg:hidden",
};

/** The disclosure column and expanded row disappear once every column fits. */
export const disclosureVisibility: Record<ColumnPriority, string> = {
  1: "hidden",
  2: "md:hidden",
  3: "lg:hidden",
};

export type Density = "comfortable" | "compact";

/** Row heights: 40 px, 48 px on touch screens; compact 32 px (desktop power users). */
export const rowHeight: Record<Density, string> = {
  comfortable: "h-10 [@media(pointer:coarse)]:h-12",
  compact: "h-8 [@media(pointer:coarse)]:h-12",
};
