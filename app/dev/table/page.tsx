// DEV ONLY: demo of the design-system DataTable, Pagination, FilterBar and
// TableSkeleton with fake data, for checking them without the DUV API.
// Remove this page (app/dev/) before launch.
import type { Metadata } from "next";
import {
  DataTable,
  FilterBar,
  NameCell,
  Pagination,
  RankCell,
  TableSkeleton,
  type ColumnDef,
  type SortDirection,
} from "@/components/design";

export const metadata: Metadata = { title: "Table demo", robots: { index: false } };

interface DemoRow {
  id: string;
  rank: number;
  name: string;
  nat: string;
  gender: "M" | "W";
  cat: string;
  result: string;
  seconds: number;
  speed: number;
  club: string;
  yob: number;
}

const first = ["Anna", "Erik", "Maria", "Johan", "Sofia", "Lars", "Elena", "Paolo", "Yuki", "Camille"];
const last = ["Lindqvist", "Müller", "Rossi", "Tanaka", "Dubois", "Kowalski", "Fernández", "Nakamura", "Olsen", "Smith"];
const nats = ["SWE", "GER", "ITA", "JPN", "FRA", "POL", "ESP", "NOR", "GBR", "USA"];
const clubs = ["IK Ultra", "LG Nord", "", "Team Trail Runners Association", "SK Långdistans", ""];

function fakeRows(): DemoRow[] {
  return Array.from({ length: 30 }, (_, i) => {
    const seconds = 7 * 3600 + 23 * 60 + i * 397 + ((i * 37) % 90);
    const gender = i % 3 === 1 ? "W" : "M";
    const yob = 1960 + ((i * 7) % 40);
    const age = 2026 - yob;
    const cat = `${gender}${age < 35 ? "" : Math.floor(age / 5) * 5}` || gender;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return {
      id: String(1000 + i),
      rank: i + 1,
      name: `${last[(i * 3) % 10]}, ${first[i % 10]}`,
      nat: nats[(i * 7) % 10],
      gender,
      cat,
      result: `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} h`,
      seconds,
      speed: Math.round((100 / (seconds / 3600)) * 1000) / 1000,
      club: clubs[i % clubs.length],
      yob,
    };
  });
}

const columns: ColumnDef<DemoRow>[] = [
  {
    id: "rank",
    accessorKey: "rank",
    header: "Rank",
    enableSorting: true,
    sortDescFirst: false,
    meta: { align: "end", width: 64 },
    cell: ({ row }) => <RankCell rank={row.original.rank} />,
  },
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    enableSorting: true,
    cell: ({ row }) => (
      <NameCell
        name={row.original.name}
        href={`/runners/${row.original.id}`}
        secondary={[row.original.nat, row.original.cat, row.original.club].filter(Boolean).join(" · ")}
      />
    ),
  },
  { id: "nat", accessorKey: "nat", header: "Nat.", meta: { priority: 2, mobileLabel: "Nationality" } },
  { id: "cat", accessorKey: "cat", header: "Cat", meta: { priority: 2, mobileLabel: "Category" } },
  {
    id: "result",
    accessorFn: (row) => row.seconds,
    header: "Result",
    enableSorting: true,
    sortDescFirst: false,
    meta: { align: "end", className: "font-semibold whitespace-nowrap" },
    cell: ({ row }) => row.original.result,
  },
  {
    id: "speed",
    accessorKey: "speed",
    header: "km/h",
    enableSorting: true,
    meta: { align: "end", priority: 3, mobileLabel: "Speed (km/h)" },
    cell: ({ getValue }) => (getValue() as number).toFixed(3),
  },
  { id: "club", accessorKey: "club", header: "Club", meta: { priority: 3 } },
  { id: "yob", accessorKey: "yob", header: "YOB", meta: { align: "end", priority: 3, mobileLabel: "Year of birth" } },
];

const PAGE_SIZE = 12;

export default async function TableDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const all = fakeRows();
  const gender = get("gender");
  const nat = get("nat");
  const filtered = all.filter((r) => (!gender || r.gender === gender) && (!nat || r.nat === nat));

  const sortParam = get("sort");
  const [sortId, sortDir] = sortParam?.split(".") ?? [];
  const sorting = sortId ? [{ id: sortId, desc: sortDir === "desc" }] : [{ id: "rank", desc: false }];

  const showAll = get("all") === "1";
  const page = Math.max(1, Number(get("page") ?? 1) || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const density = get("density") === "compact" ? "compact" : "comfortable";

  const query = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") next.set(k, v);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return `/dev/table${qs ? `?${qs}` : ""}`;
  };
  const sortHref = (id: string, dir: SortDirection) => query({ sort: `${id}.${dir}`, page: null });

  // Sort the whole filtered list first, then slice the page (the server would do this).
  const sortedAll = [...filtered].sort((a, b) => {
    const key = (sorting[0].id === "result" ? "seconds" : sorting[0].id) as keyof DemoRow;
    const cmp = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
    return sorting[0].desc ? -cmp : cmp;
  });
  const rows = showAll ? sortedAll : sortedAll.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container flex flex-col gap-6 py-6">
      <h1 className="text-2xl font-semibold md:text-3xl">Table demo</h1>

      <FilterBar
        filters={[
          {
            param: "gender",
            label: "Gender",
            options: [
              { value: "M", label: "Men" },
              { value: "W", label: "Women" },
            ],
          },
          { param: "nat", label: "Country", options: nats.map((n) => ({ value: n, label: n })) },
          {
            param: "density",
            label: "Density",
            options: [{ value: "compact", label: "Compact" }],
          },
        ]}
      >
        <input
          type="search"
          placeholder="Find a runner"
          aria-label="Find a runner"
          className="h-11 w-full rounded-md border border-border bg-surface px-3 text-base md:h-9 md:w-56 md:text-sm"
        />
      </FilterBar>

      <DataTable
        data={rows}
        columns={columns}
        caption="Results of the demo 100 km, 30 finishers"
        getRowId={(row) => row.id}
        highlightRowId={get("highlight") ?? "1007"}
        rowLabel={(row) => row.name}
        sorting={sorting}
        sortHref={sortHref}
        manualSorting
        density={density}
      />

      <Pagination
        page={page}
        pageCount={showAll ? 1 : pageCount}
        hrefForPage={(n) => query({ page: n === 1 ? null : String(n), all: null })}
        showAllHref={showAll ? undefined : query({ all: "1", page: null })}
      />

      <h2 className="text-lg font-semibold">Sticky columns (splits matrix)</h2>
      <DataTable
        data={all.slice(0, 8)}
        columns={[
          columns[0],
          { ...columns[1], meta: { width: 200 } },
          ...["10 km", "25 km", "42.195 km", "50 km", "75 km", "6 h", "100 km"].map(
            (label, i): ColumnDef<DemoRow> => ({
              id: `split-${i}`,
              header: label,
              meta: { align: "end", className: "whitespace-nowrap" },
              cell: ({ row }) => {
                const t = Math.round((row.original.seconds * [0.09, 0.23, 0.4, 0.48, 0.73, 0.82, 1][i]) / 60);
                return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
              },
            })
          ),
        ]}
        caption="Splits"
        captionVisible
        getRowId={(row) => row.id}
        stickyColumns={2}
      />

      <h2 className="text-lg font-semibold">Loading skeleton</h2>
      <TableSkeleton
        rows={5}
        columns={[
          { align: "end" },
          { twoLine: true },
          { priority: 2 },
          { priority: 2 },
          { align: "end" },
          { priority: 3, align: "end" },
          { priority: 3 },
          { priority: 3, align: "end" },
        ]}
      />
    </div>
  );
}
