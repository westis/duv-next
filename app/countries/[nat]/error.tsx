"use client";

import { Button } from "@/components/ui/button";

export default function CountryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);
  return (
    <div className="rounded-md border p-6 space-y-3">
      <p className="font-medium">Could not load data from DUV.</p>
      <p className="text-sm text-muted-foreground">
        The statistics server may be busy. Please try again.
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
