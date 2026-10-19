import { formatDateVariant, type DateVariant } from "./dates";

export interface DateTextProps {
  /** DUV ("30.09.1981", "06.-07.04.2024") or ISO date. */
  value: string | null | undefined;
  /** Closes a range when `value` is a single day. */
  end?: string | null;
  locale: string;
  variant?: DateVariant;
  className?: string;
}

/**
 * `<time dateTime="1981-09-30">30 SEP 1981</time>`. Server-safe (no hooks).
 * For a range, `dateTime` is the start date. Unreadable input renders as-is,
 * except a birth date: DUV's unknown "00.00.0000" renders nothing.
 */
export function DateText({ value, end, locale, variant = "day", className }: DateTextProps) {
  const classes = className ? `tabular-nums ${className}` : "tabular-nums";
  const formatted = formatDateVariant(variant, value, locale, end);
  if (!formatted) {
    if (variant === "birth") return null;
    const raw = (value ?? "").replace(/&nbsp;/gi, " ").trim();
    return raw ? <span className={classes}>{raw}</span> : null;
  }
  return (
    <time dateTime={formatted.dateTime} className={classes}>
      {formatted.text}
    </time>
  );
}
