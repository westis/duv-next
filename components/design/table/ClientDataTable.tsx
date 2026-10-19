"use client";

import { useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import { DataTable, type DataTableProps } from "./DataTable";

export interface ClientDataTableProps<TData>
  extends Omit<DataTableProps<TData>, "sorting" | "onSortingChange" | "sortHref"> {
  initialSorting?: SortingState;
}

/**
 * DataTable with client-side sorting kept in state. Columns contain functions,
 * so use it from a client component that defines the columns; server pages
 * sort through the URL with DataTable's `sortHref` instead.
 */
export function ClientDataTable<TData>({ initialSorting = [], ...props }: ClientDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  return <DataTable {...props} sorting={sorting} onSortingChange={setSorting} />;
}
