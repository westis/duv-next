import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LinkText, OutLink } from "@/components/design";
import { cleanDuv, linkHost } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventDetails } from "@/lib/duv";
import { formatEmail, toExternalUrl } from "./eventDetailUtils";

function InfoList({ rows }: { rows: [string, ReactNode][] }) {
  const visible = rows.filter(([, value]) => value !== "" && value != null);
  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">No information yet.</p>;
  }
  return (
    <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
      {visible.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere] whitespace-pre-line">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CourseCard({ event, status }: { event: EventDetails; status?: string }) {
  const finishers =
    event.FinisherM || event.FinisherW
      ? `${event.FinisherM ?? 0} men, ${event.FinisherW ?? 0} women`
      : "";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Race</CardTitle>
      </CardHeader>
      <CardContent>
        <InfoList
          rows={[
            ["Status", status ?? ""],
            ["Race type", event.RaceType ?? ""],
            ["Length", event.Length],
            ["Duration", event.Duration],
            ["Elevation gain/loss", event.AltitudeDiff],
            ["Time limit", event.TimeLimit],
            ["Field limit", event.FieldLimit],
            ["Entry fee", event.Fee],
            ["Finishers", finishers],
            ["Course", cleanDuv(event.CourseDesc) && <LinkText value={event.CourseDesc} />],
            ["Further information", cleanDuv(event.MoreInfo) && <LinkText value={event.MoreInfo} />],
          ]}
        />
      </CardContent>
    </Card>
  );
}

export function OrganizerCard({ event }: { event: EventDetails }) {
  const t = useTranslations("race");
  const website = toExternalUrl(event.URL);
  const email = formatEmail(event.Email);
  const address = [event.Address, [event.Postcode, event.City].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join("\n");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizer</CardTitle>
      </CardHeader>
      <CardContent>
        <InfoList
          rows={[
            ["Organisation", event.PromOrg],
            ["Contact person", event.Contact],
            ["Address", address],
            [
              "Phone",
              event.Phone && (
                <a href={`tel:${event.Phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                  {event.Phone}
                </a>
              ),
            ],
            [
              "Email",
              email && (
                <a href={`mailto:${email}`} className="hover:underline">
                  {email}
                </a>
              ),
            ],
            [
              "Web page",
              website && <OutLink href={website}>{linkHost(website)}</OutLink>,
            ],
            ["Miscellaneous", cleanDuv(event.Comments) && <LinkText value={event.Comments} />],
            [
              t("resultSource"),
              cleanDuv(event.ResultSource) && <LinkText value={event.ResultSource} label={t("resultSource")} />,
            ],
          ]}
        />
      </CardContent>
    </Card>
  );
}
