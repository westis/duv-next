import { Switch } from "@/components/ui/switch";

interface RecordEligibleFilterProps {
  recordEligible: boolean;
  onRecordEligibleChange: (checked: boolean) => void;
}

export function RecordEligibleFilter({
  recordEligible,
  onRecordEligibleChange,
}: RecordEligibleFilterProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="record-eligible"
        checked={recordEligible}
        onCheckedChange={onRecordEligibleChange}
      />
      <span>Record Eligible</span>
    </div>
  );
}
