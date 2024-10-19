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
      size="icon"
      className="h-10 w-10"
      onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
    >
      {sortOrder === "asc" ? (
        <SortAsc className="h-4 w-4" />
      ) : (
        <SortDesc className="h-4 w-4" />
      )}
    </Button>
  );
}
