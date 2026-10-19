import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { linkHost, splitLinks } from "@/lib/format";

/** A short external link that opens in a new tab: label plus an icon, never the long URL. */
export function OutLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={href}
      className={`inline-flex items-center gap-1 text-link hover:underline${className ? ` ${className}` : ""}`}
    >
      {children}
      <ExternalLink className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
    </a>
  );
}

/**
 * Text from DUV that may hold URLs (result source, comments). Each URL becomes
 * a short link: `label` when the value is a single link, else the host name.
 * Plain text stays as it is.
 */
export function LinkText({ value, label }: { value: string | null | undefined; label?: string }) {
  const segments = splitLinks(value);
  const links = segments.filter((s) => "url" in s);
  if (links.length === 0) return <>{segments.map((s) => ("text" in s ? s.text : "")).join("")}</>;
  const onlyLink = segments.length === 1;
  return (
    <>
      {segments.map((s, i) =>
        "url" in s ? (
          <OutLink key={i} href={s.url}>
            {onlyLink && label ? label : linkHost(s.url)}
          </OutLink>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </>
  );
}
