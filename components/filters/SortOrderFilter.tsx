import { Button } from "@/components/ui/button";
import { SortAsc, SortDesc } from "lucide-react";

interface SortOrderFilterProps {
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
}

export function SortOrderFilter({
  sortOrder,
  onSortOrderChange,
}: SortOrderFilterProps) {
  return (
    <Button
      variant="outline"
      className="h-10 px-3 flex items-center"
      onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
    >
      {sortOrder === "asc" ? (
        <SortAsc className="h-4 w-4 mr-2" />
      ) : (
        <SortDesc className="h-4 w-4 mr-2" />
      )}
      <span>Sort</span>
    </Button>
  );
}
