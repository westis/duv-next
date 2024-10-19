import { Switch } from "@/components/ui/switch";

interface WithoutResultsFilterProps {
  withoutResults: boolean;
  onWithoutResultsChange: (checked: boolean) => void;
}

export function WithoutResultsFilter({
  withoutResults,
  onWithoutResultsChange,
}: WithoutResultsFilterProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="without-results"
        checked={withoutResults}
        onCheckedChange={onWithoutResultsChange}
      />
      <span>Without Results</span>
    </div>
  );
}
