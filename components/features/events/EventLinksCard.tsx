import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventDetailListEntry } from "@/lib/duv";
import { describeLinkEntry } from "./eventDetailUtils";

function LinkList({ title, entries }: { title: string; entries: EventDetailListEntry[] }) {
  const links = entries.map(describeLinkEntry).filter((l) => l.url);
  if (links.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <ul className="space-y-1">
        {links.map((link, i) => (
          <li key={`${link.url}-${i}`}>
            <a
              href={link.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-500 hover:underline break-all"
            >
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface OldSiteLink {
  label: string;
  href: string;
}

export function EventLinksCard({
  reports,
  gpsTracks,
  oldSiteLinks,
}: {
  reports: EventDetailListEntry[];
  gpsTracks: EventDetailListEntry[];
  oldSiteLinks: OldSiteLink[];
}) {
  const hasAny =
    oldSiteLinks.length > 0 ||
    reports.some((r) => describeLinkEntry(r).url) ||
    gpsTracks.some((g) => describeLinkEntry(g).url);
  if (!hasAny) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports, tracks and statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LinkList title="Reports" entries={reports} />
        <LinkList title="GPS tracks" entries={gpsTracks} />
        {oldSiteLinks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              More on statistik.d-u-v.org
            </h3>
            <ul className="space-y-1">
              {oldSiteLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-500 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
