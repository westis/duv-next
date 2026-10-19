import { cn } from "@/lib/utils";

export interface SpanAxis {
  from: number;
  to: number;
}

/** "1983–2014", or one year when the runner was active in only one. */
export function spanText(from: number | null, to: number | null): string {
  if (from === null || to === null) return "";
  return from === to ? String(from) : `${from}–${to}`;
}

/**
 * A runner's active years as a bar on a time axis shared by the whole list,
 * so namesakes from different decades tell apart at a glance. The years are
 * always written beside it: the bar only adds the picture.
 */
export function ActiveSpan({
  from,
  to,
  axis,
  showYears = true,
  className,
}: {
  from: number | null;
  to: number | null;
  axis: SpanAxis | null;
  showYears?: boolean;
  className?: string;
}) {
  const years = spanText(from, to);
  const total = axis ? axis.to - axis.from + 1 : 0;
  const left = axis && from !== null ? ((from - axis.from) / total) * 100 : 0;
  const width = axis && from !== null && to !== null ? ((to - from + 1) / total) * 100 : 0;
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="relative block h-2 min-w-0 flex-1 border-b border-border bg-[repeating-linear-gradient(90deg,var(--hair)_0_1px,transparent_1px_10%)]"
      >
        {axis && from !== null && (
          <span
            className="absolute top-px h-1.5 min-w-1 rounded-[2px] bg-link"
            style={{ insetInlineStart: `${left}%`, width: `${width}%` }}
          />
        )}
      </span>
      {showYears && <span className="w-[4.5rem] shrink-0 text-end text-xs text-fg-muted tabular">{years}</span>}
    </span>
  );
}
