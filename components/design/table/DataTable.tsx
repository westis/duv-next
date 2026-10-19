import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  createTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type Cell,
  type Column,
  type ColumnDef,
  type Header,
  type Row,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { DataTableRow } from "./DataTableRow";
import {
  cellVisibility,
  detailVisibility,
  disclosureVisibility,
  rowHeight,
  type ColumnPriority,
  type Density,
} from "./columns";

export type SortDirection = "asc" | "desc";

export interface DataTableProps<TData> {
  data: TData[];
  // TanStack column values are heterogeneous; `any` is its documented pattern here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  /** Says what the table lists. Read by screen readers; shown only with `captionVisible`. */
  caption: ReactNode;
  captionVisible?: boolean;
  /** Stable row id (for `highlightRowId` and React keys). Defaults to the row index. */
  getRowId?: (row: TData, index: number) => string;
  /** Paints this row in the highlight colour and scrolls it into view. */
  highlightRowId?: string;
  density?: Density;
  /** The current sort. With `sortHref` it comes from the URL; with `onSortingChange` from state. */
  sorting?: SortingState;
  /** Link-based sorting (server pages): the URL that sorts by this column in this direction. */
  sortHref?: (columnId: string, direction: SortDirection) => string;
  /** Client-side sorting: called with the next sort. Only from a client component (see ClientDataTable). */
  onSortingChange?: (sorting: SortingState) => void;
  /** The rows already arrive sorted (by the API): don't sort them again here. */
  manualSorting?: boolean;
  /**
   * Wide matrices (splits): scroll sideways with the first N columns sticky.
   * Every column is shown (no priorities); sticky columns need `meta.width`.
   */
  stickyColumns?: number;
  /** Name of a row for its disclosure button ("Show details for {name}"). */
  rowLabel?: (row: TData) => string;
  /** Shown in place of the rows when there are none. */
  empty?: ReactNode;
  className?: string;
}

const headCell = "border-b border-border bg-surface-muted px-2 py-2 text-xs font-medium text-fg-muted md:px-3";
const bodyCell = "border-b border-border px-2 py-1.5 align-middle md:px-3";

/**
 * The site's one data table (design spec, "Data table"). Renders on the server
 * when it can: only the per-row disclosure is a client component, and sorting
 * either links to a URL (`sortHref`) or, inside a client component, calls
 * `onSortingChange`.
 *
 * Columns carry `meta.priority` (1 always, 2 from md, 3 from lg). Below those
 * widths the row gets a disclosure button that lists the hidden columns.
 */
export function DataTable<TData>({
  data,
  columns,
  caption,
  captionVisible = false,
  getRowId,
  highlightRowId,
  density = "comfortable",
  sorting = [],
  sortHref,
  onSortingChange,
  manualSorting = false,
  stickyColumns = 0,
  rowLabel,
  empty,
  className,
}: DataTableProps<TData>) {
  const t = useTranslations("table");

  // createTable is TanStack's framework-free core: no hooks, so it also runs in server components.
  const table = createTable<TData>({
    data,
    columns,
    defaultColumn: { enableSorting: false },
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualSorting,
    enableSortingRemoval: false,
    enableMultiSort: false,
    state: {},
    onStateChange: () => {},
    onSortingChange: onSortingChange
      ? (updater: Updater<SortingState>) =>
          onSortingChange(typeof updater === "function" ? updater(sorting) : updater)
      : undefined,
    renderFallbackValue: null,
  });
  table.setOptions((prev) => ({ ...prev, state: { ...table.initialState, sorting } }));

  const sticky = stickyColumns > 0;
  const leafColumns = table.getAllLeafColumns();
  const priorityOf = (column: Column<TData, unknown>): ColumnPriority =>
    sticky ? 1 : (column.columnDef.meta?.priority ?? 1);
  const maxPriority = leafColumns.reduce<ColumnPriority>(
    (max, column) => (priorityOf(column) > max ? priorityOf(column) : max),
    1
  );
  const expandable = maxPriority > 1;
  const disclosureClass = disclosureVisibility[maxPriority];
  const colSpan = leafColumns.length + (expandable ? 1 : 0);

  // Sticky columns: each one's inline-start offset is the sum of the widths before it.
  const stickyOffset = new Map<string, number>();
  leafColumns.slice(0, stickyColumns).reduce((offset, column) => {
    stickyOffset.set(column.id, offset);
    return offset + (column.columnDef.meta?.width ?? 0);
  }, 0);
  const lastStickyId = sticky ? leafColumns[stickyColumns - 1]?.id : undefined;

  const columnClasses = (column: Column<TData, unknown>) => {
    const meta = column.columnDef.meta;
    return cn(
      cellVisibility[priorityOf(column)],
      meta?.align === "end" ? "text-end tabular" : "text-start",
      stickyOffset.has(column.id) && "sticky z-10",
      column.id === lastStickyId && "border-e"
    );
  };
  const columnStyle = (column: Column<TData, unknown>) => {
    // Sticky mode holds widths fixed (the offsets depend on them); elsewhere a width is
    // only a hint, so the priority columns still fit a 360 px screen.
    const width = column.columnDef.meta?.width;
    const offset = stickyOffset.get(column.id);
    return {
      ...(width ? (sticky ? { width, minWidth: width } : { width }) : {}),
      ...(offset !== undefined ? { insetInlineStart: offset } : {}),
    };
  };

  const label = (column: Column<TData, unknown>) => {
    const { header, meta } = column.columnDef;
    return meta?.mobileLabel ?? (typeof header === "string" ? header : column.id);
  };

  const renderHeader = (header: Header<TData, unknown>) => {
    const { column } = header;
    const content = header.isPlaceholder ? null : flexRender(column.columnDef.header, header.getContext());
    const sorted = column.getIsSorted();
    const canSort = column.getCanSort() && (sortHref || onSortingChange);
    const ariaSort = sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined;
    const end = column.columnDef.meta?.align === "end";

    let inner: ReactNode = content;
    if (canSort) {
      const next: SortDirection = sorted ? (sorted === "asc" ? "desc" : "asc") : column.getFirstSortDir();
      const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
      const control = cn(
        "group -mx-1 inline-flex min-h-8 items-center gap-1 rounded-sm px-1 font-medium no-underline hover:text-fg",
        end && "flex-row-reverse",
        sorted ? "text-fg" : "text-fg-muted"
      );
      const body = (
        <>
          <span>{content}</span>
          <Icon
            aria-hidden
            strokeWidth={1.75}
            className={cn(
              "size-3.5 shrink-0",
              !sorted && "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
            )}
          />
          {!sorted && <span className="sr-only">{t("sortHint")}</span>}
        </>
      );
      inner = sortHref ? (
        <Link href={sortHref(column.id, next)} scroll={false} className={control}>
          {body}
        </Link>
      ) : (
        <button type="button" onClick={() => column.toggleSorting(next === "desc")} className={control}>
          {body}
        </button>
      );
    }

    return (
      <th
        key={header.id}
        scope="col"
        colSpan={header.colSpan > 1 ? header.colSpan : undefined}
        aria-sort={ariaSort}
        style={columnStyle(column)}
        className={cn(headCell, columnClasses(column), "whitespace-nowrap")}
      >
        {inner}
      </th>
    );
  };

  const renderCell = (cell: Cell<TData, unknown>) => (
    <td
      key={cell.id}
      style={columnStyle(cell.column)}
      className={cn(
        bodyCell,
        rowHeight[density],
        columnClasses(cell.column),
        stickyOffset.has(cell.column.id) && "bg-surface group-data-[highlight]/row:bg-highlight",
        cell.column.columnDef.meta?.className
      )}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );

  const renderDetails = (row: Row<TData>) => {
    const hidden = row.getVisibleCells().filter((cell) => priorityOf(cell.column) > 1);
    return (
      <dl className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-4 gap-y-1 text-sm">
        {hidden.map((cell) => (
          <div key={cell.id} className={cn("contents", detailVisibility[priorityOf(cell.column)])}>
            <dt className="text-xs leading-5 text-fg-muted">{label(cell.column)}</dt>
            <dd className={cn("min-w-0", cell.column.columnDef.meta?.align === "end" && "tabular")}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </dd>
          </div>
        ))}
      </dl>
    );
  };

  const rows = table.getRowModel().rows;

  const tableEl = (
    <table className={cn("w-full border-separate border-spacing-0 text-sm", sticky && "w-max min-w-full")}>
      <caption className={cn(captionVisible ? "px-3 py-2 text-start text-sm text-fg-muted" : "sr-only")}>
        {caption}
      </caption>
      <thead className={cn(!sticky && "md:sticky md:top-[var(--table-sticky-top,3.5rem)] md:z-20")}>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map(renderHeader)}
            {expandable && (
              <th scope="col" className={cn(headCell, "w-11 p-0", disclosureClass)}>
                <span className="sr-only">{t("details")}</span>
              </th>
            )}
          </tr>
        ))}
      </thead>
      <tbody className="[&>tr:last-child>td]:border-b-0">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={colSpan} className="px-3 py-10 text-center text-fg-muted">
              {empty ?? t("empty")}
            </td>
          </tr>
        ) : (
          rows.map((row) => {
            const highlight = highlightRowId !== undefined && row.id === highlightRowId;
            return (
              <DataTableRow
                key={row.id}
                highlight={highlight}
                colSpan={colSpan}
                cellClassName={bodyCell}
                className={cn(
                  "group/row",
                  highlight ? "bg-highlight" : "hover:bg-surface-muted/60"
                )}
                details={expandable ? renderDetails(row) : undefined}
                disclosureClass={disclosureClass}
                detailsLabel={
                  !expandable
                    ? undefined
                    : rowLabel
                      ? t("showDetailsFor", { name: rowLabel(row.original) })
                      : t("showDetails")
                }
              >
                {row.getVisibleCells().map(renderCell)}
              </DataTableRow>
            );
          })
        )}
      </tbody>
    </table>
  );

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface",
        sticky ? "overflow-x-auto overscroll-x-contain" : "overflow-clip",
        className
      )}
    >
      {tableEl}
    </div>
  );
}
