"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEventResults } from "@/hooks/useEventResults";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Row } from "@tanstack/react-table";

// Update the Result interface to include PerformanceNumeric
interface Result {
  rank: string;
  performance: string;
  performanceNumeric: string;
  name: string; // This now contains the formatted name
  club: string;
  nationality: string;
  yearOfBirth: string;
  dob: string;
  sex: string;
  ageGradePerf: string;
  rankMW: string;
  cat: string;
  rankCat: string;
  personId: string;
}

type ResultValue = Result[keyof Result];
type ResultColumn = ColumnDef<Result, ResultValue>;

const columns: ResultColumn[] = [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => {
      const gender = row.original.sex;
      const rankMW = row.original.rankMW;
      const rankCat = row.original.rankCat;
      return <span>{gender ? rankMW : rankCat}</span>;
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/runners/${row.original.personId}`}
        className="text-blue-500 hover:underline"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "birthDate",
    header: "Birth Date",
    cell: ({ row }) => {
      const dob = row.original.dob;
      const yob = row.original.yearOfBirth;
      return (
        <span className="hidden md:inline">
          {dob && dob !== "0000-00-00" ? dob : yob}
        </span>
      );
    },
  },
  {
    accessorKey: "club",
    header: "Club",
    cell: ({ row }) => (
      <span className="hidden lg:inline">{row.getValue("club")}</span>
    ),
  },
  {
    accessorKey: "nationality",
    header: "Nat.",
  },
  {
    accessorKey: "sex",
    header: "Sex",
  },
  {
    accessorKey: "performanceNumeric",
    header: "Result",
    cell: ({ row }) => <span>{row.original.performanceNumeric}</span>,
  },
];

export default function ResultsTable({ eventId }: { eventId: string }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [gender, setGender] = useState("All");
  const [ageGroup, setAgeGroup] = useState("All");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [nameFilter, setNameFilter] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const { results, eventInfo, loading, error } = useEventResults(eventId);

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const genderMatch = gender === "All" || result.sex === gender;
      const ageGroupMatch = ageGroup === "All" || result.cat === ageGroup;
      const nameMatch = result.name
        .toLowerCase()
        .includes(nameFilter.toLowerCase());
      const nationalityMatch = result.nationality
        .toLowerCase()
        .includes(nationalityFilter.toLowerCase());
      const clubMatch = result.club
        .toLowerCase()
        .includes(clubFilter.toLowerCase());
      return (
        genderMatch &&
        ageGroupMatch &&
        nameMatch &&
        nationalityMatch &&
        clubMatch
      );
    });
  }, [results, gender, ageGroup, nameFilter, nationalityFilter, clubFilter]);

  const table = useReactTable({
    data: filteredResults,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  const handleGenderChange = useCallback((value: string) => {
    setGender(value);
  }, []);

  const handleAgeGroupChange = useCallback((value: string) => {
    setAgeGroup(value);
  }, []);

  const toggleRowExpanded = useCallback((rowId: string) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  }, []);

  const toggleFilters = useCallback(() => {
    setIsFiltersExpanded((prev) => !prev);
  }, []);

  const sortedAgeGroups = useMemo(() => {
    const groups = [
      "All",
      ...Array.from(new Set(results.map((r) => r.cat))),
    ].sort((a, b) => {
      if (a === "All") return -1;
      if (b === "All") return 1;
      const aNum = parseInt(a.replace(/[MW]/g, "")) || 0;
      const bNum = parseInt(b.replace(/[MW]/g, "")) || 0;
      return aNum - bNum;
    });

    const filteredGroups =
      gender === "M"
        ? groups.filter((g) => g === "All" || g.startsWith("M"))
        : gender === "F"
        ? groups.filter((g) => g === "All" || g.startsWith("W"))
        : groups;

    return filteredGroups.map((g) => ({
      value: g,
      label: g === "All" ? "All Age Groups" : g,
    }));
  }, [results, gender]);

  const genders = [
    { value: "All", label: "All Genders" },
    { value: "M", label: "Male" },
    { value: "F", label: "Female" },
  ];

  const renderExpandedContent = (row: Row<Result>) => (
    <div className="p-2">
      <p className="md:hidden">
        Birth Date:{" "}
        {row.original.dob && row.original.dob !== "0000-00-00"
          ? row.original.dob
          : row.original.yearOfBirth}
      </p>
      <p className="lg:hidden">Club: {row.original.club}</p>
      <p>Age Grade Performance: {row.original.ageGradePerf}</p>
      <p>Category: {row.original.cat}</p>
      <p>Category Rank: {row.original.rankCat}</p>
    </div>
  );

  if (loading) return <div>Loading results...</div>;
  if (error) return <div>Error: {error}</div>;
  if (results.length === 0) return <div>No results found.</div>;

  return (
    <div>
      {eventInfo && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{eventInfo.EvtName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Date: {eventInfo.EvtDate}</p>
            <p>Source: {eventInfo.Resultsource}</p>
            <p>Recorded by: {eventInfo.RecordedBy}</p>
            <p>Ranking eligible: {eventInfo.RecordEligible}</p>
            <p>
              <Link href={eventInfo.EvtDetailLink}>Event details</Link>
            </p>
            <p>Results: {eventInfo.FinisherCnt}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-wrap gap-4">
          <Select value={gender} onValueChange={handleGenderChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {genders.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ageGroup} onValueChange={handleAgeGroupChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select age group" />
            </SelectTrigger>
            <SelectContent>
              {sortedAgeGroups.map((ag) => (
                <SelectItem key={ag.value} value={ag.value}>
                  {ag.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={toggleFilters} variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            {isFiltersExpanded ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
        {isFiltersExpanded && (
          <div className="flex flex-wrap gap-4">
            <input
              placeholder="Filter names..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="border p-2 rounded flex-grow min-w-[200px]"
            />
            <input
              placeholder="Filter nationalities..."
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
              className="border p-2 rounded flex-grow min-w-[200px]"
            />
            <input
              placeholder="Filter clubs..."
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
              className="border p-2 rounded flex-grow min-w-[200px]"
            />
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.id === "birthDate"
                        ? "hidden md:table-cell"
                        : header.column.id === "club"
                        ? "hidden lg:table-cell"
                        : ""
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
                <TableHead>More</TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === "birthDate"
                            ? "hidden md:table-cell"
                            : cell.column.id === "club"
                            ? "hidden lg:table-cell"
                            : ""
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpanded(row.id)}
                      >
                        {expandedRows[row.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRows[row.id] && (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1}>
                        {renderExpandedContent(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination controls */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
      {/* Rows per page selector */}
      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium">Rows per page</p>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
