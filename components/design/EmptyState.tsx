import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One sentence saying what is missing and why, plus an optional next step.
 * Almanac look: no box, a hairline above and below, left-aligned muted text.
 */
export function EmptyState({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("border-y border-hair py-8", className)}>
      <p className="max-w-prose text-fg-muted">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
