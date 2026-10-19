import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** One sentence saying what is missing and why, plus an optional next step. */
export function EmptyState({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-md border border-border bg-surface px-4 py-10 text-center", className)}>
      <p className="text-fg-muted">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
