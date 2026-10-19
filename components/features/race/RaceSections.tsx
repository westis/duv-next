import Link from "next/link";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { LinkText, OutLink, SectionHeading } from "@/components/design";
import {
  describeLinkEntry,
  formatEmail,
  resolveDuvLink,
  toExternalUrl,
} from "@/components/features/events/eventDetailUtils";
import { getDuvBaseUrl } from "@/lib/duv";
import type { EventResultsHeader } from "@/lib/duv";
import {
  DateText,
  cleanDuv,
  formatCount,
  formatLengthAndClimb,
  formatPerformanceText,
  formatRunnerName,
  linkHost,
} from "@/lib/format";
import { courseWinners, type EditionWinner } from "@/lib/records/course";
import { formatRaceLength } from "@/lib/tags";
import { cn } from "@/lib/utils";
import type { LoadedRace } from "./loadRace";
import { finishersOf, parseWinnerField, sameDistance, type NationTeam, type ResultKind, type WinnerRow } from "./raceModel";
import { totalText } from "./raceText";

const headingClass = "scroll-mt-[calc(var(--header-h)+1rem)]";
const th = "label-caps py-2 pe-3 font-semibold text-fg-muted";
const td = "border-b border-hair py-2 pe-3 align-baseline";

// ---- Nations ----------------------------------------------------------------

const NATIONS_SHOWN = 10;

export async function RaceNations({ teams, kind }: { teams: { W: NationTeam[]; M: NationTeam[] }; kind: ResultKind | null }) {
  const t = await getTranslations("race.nations");
  const locale = await getLocale();
  const cols = [
    { label: t("women"), list: teams.W },
    { label: t("men"), list: teams.M },
  ].filter((c) => c.list.length > 0);
  return (
    <section aria-labelledby="nations">
      <SectionHeading id="nations" className={headingClass}>
        {t("heading")}
      </SectionHeading>
      <p className="mb-3 max-w-prose text-sm text-fg-muted">{t("note")}</p>
      <div className="grid gap-8 md:grid-cols-2">
        {cols.map((c) => (
          <table key={c.label} className="w-full table-fixed border-collapse text-sm md:text-[0.9375rem]">
            <caption className="sr-only">{c.label}</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className={cn(th, "w-8 text-end")}>
                  {t("rank")}
                </th>
                <th scope="col" className={cn(th, "text-start")}>
                  {c.label}
                </th>
                <th scope="col" className={cn(th, "w-28 pe-0 text-end")}>
                  {kind === "distance" ? `${t("total")} (km)` : t("total")}
                </th>
              </tr>
            </thead>
            <tbody>
              {c.list.slice(0, NATIONS_SHOWN).map((team, i) => (
                <tr key={team.nat}>
                  <td className={cn(td, "text-end text-fg-muted tabular")}>{i + 1}</td>
                  <td className={cn(td, "min-w-0")}>
                    <span className="font-medium">{team.nat}</span>
                    <span className="block truncate text-xs text-fg-muted">
                      {team.members.map((m) => formatRunnerName({ last: m.row.LastName }, locale)).join(", ")}
                    </span>
                  </td>
                  <td className={cn(td, "pe-0 text-end font-semibold tabular")}>{totalText(team.total, kind, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </section>
  );
}

// ---- Splits -----------------------------------------------------------------

function sizeLabel(w: Pick<WinnerRow, "Length" | "Duration">) {
  return formatRaceLength(cleanDuv(w.Duration) || cleanDuv(w.Length));
}

function WinnerCell({ raw, locale }: { raw: string | null | undefined; locale: string }) {
  const w = parseWinnerField(raw);
  if (!w) return null;
  return (
    <>
      <span className="font-semibold tabular">{w.perf ? formatPerformanceText(w.perf, locale) : ""}</span>
      <span className="block text-xs text-fg-muted md:text-sm">{w.name}</span>
    </>
  );
}

export async function RaceSplits({ splits, self }: { splits: WinnerRow[]; self: WinnerRow | undefined }) {
  const t = await getTranslations("race.splits");
  const locale = await getLocale();
  const rows = self ? [...splits, self] : splits;
  return (
    <section aria-labelledby="splits">
      <SectionHeading id="splits" className={headingClass}>
        {t("heading")}
      </SectionHeading>
      <p className="mb-3 max-w-prose text-sm text-fg-muted">{t("note")}</p>
      <table className="w-full max-w-3xl border-collapse text-sm md:text-[0.9375rem]">
        <caption className="sr-only">{t("caption")}</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className={cn(th, "text-start")}>
              {t("at")}
            </th>
            <th scope="col" className={cn(th, "text-start")}>
              {t("women")}
            </th>
            <th scope="col" className={cn(th, "text-start")}>
              {t("men")}
            </th>
            <th scope="col" className={cn(th, "pe-0 text-end")}>
              {t("runners")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const isSelf = s === self;
            return (
              <tr key={s.EventID} className={isSelf ? "bg-surface-muted" : undefined}>
                <th scope="row" className={cn(td, "text-start font-medium whitespace-nowrap")}>
                  {isSelf ? (
                    <span>
                      {sizeLabel(s)} <span className="font-normal text-fg-muted">({t("finish")})</span>
                    </span>
                  ) : (
                    <Link href={`/events/${s.EventID}`}>{sizeLabel(s)}</Link>
                  )}
                </th>
                <td className={td}>
                  <WinnerCell raw={s.Winner_W} locale={locale} />
                </td>
                <td className={td}>
                  <WinnerCell raw={s.Winner_M} locale={locale} />
                </td>
                <td className={cn(td, "pe-0 text-end text-fg-muted tabular")}>{formatCount(finishersOf(s), locale)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

// ---- Editions ---------------------------------------------------------------

export async function RaceEditions({ race, editions }: { race: LoadedRace; editions: WinnerRow[] }) {
  const t = await getTranslations("race.editions");
  const locale = await getLocale();
  const event = race.raceDetails;
  const name = cleanDuv(event.EventName);
  const course = courseWinners(event, race.winnerList.filter((w) => editions.includes(w)));
  return (
    <section aria-labelledby="editions">
      <SectionHeading id="editions" aside={formatCount(editions.length, locale)} className={headingClass}>
        {t("heading")}
      </SectionHeading>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        {course.filter((w) => w.gender === "M").length >= 3 && (
          <EditionsChart
            winners={course}
            current={event.EventID}
            label={t("chartLabel")}
            men={t("chartMen")}
            women={t("chartWomen")}
          />
        )}
        <table className="w-full border-collapse text-sm md:text-[0.9375rem] lg:order-first">
          <caption className="sr-only">{t("caption")}</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className={cn(th, "text-start")}>
                {t("year")}
              </th>
              <th scope="col" className={cn(th, "text-start")}>
                {t("women")}
              </th>
              <th scope="col" className={cn(th, "text-start")}>
                {t("men")}
              </th>
              <th scope="col" className={cn(th, "pe-0 text-end")}>
                {t("finishers")}
              </th>
            </tr>
          </thead>
          <tbody>
            {editions.map((e) => {
              const current = e.EventID === event.EventID;
              const otherName = cleanDuv(e.EventName) !== name ? cleanDuv(e.EventName) : "";
              const otherSize = !sameDistance(e, event) ? sizeLabel(e) : "";
              const date = e.SDate ? <DateText value={e.SDate} locale={locale} variant="year" /> : e.Year;
              return (
                <tr key={e.EventID} className={current ? "bg-highlight" : undefined}>
                  <th scope="row" className={cn(td, "text-start font-medium")}>
                    {current ? (
                      <span>
                        {date}
                        <span className="sr-only"> ({t("current")})</span>
                      </span>
                    ) : (
                      <Link href={`/events/${e.EventID}`}>{date}</Link>
                    )}
                    {(otherName || otherSize) && (
                      <span className="block text-xs font-normal text-fg-muted">
                        {[otherSize, otherName].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </th>
                  <td className={td}>
                    <WinnerCell raw={e.Winner_W} locale={locale} />
                  </td>
                  <td className={td}>
                    <WinnerCell raw={e.Winner_M} locale={locale} />
                  </td>
                  <td className={cn(td, "pe-0 text-end text-fg-muted tabular")}>
                    {formatCount(finishersOf(e), locale)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Winning marks per edition on this course: men solid, women dashed, this
 * edition circled in red. Server-drawn SVG; the table beside it holds the figures.
 */
function EditionsChart({
  winners,
  current,
  label,
  men,
  women,
}: {
  winners: EditionWinner[];
  current: string;
  label: string;
  men: string;
  women: string;
}) {
  const W = 520;
  const H = 180;
  const pad = { l: 44, r: 10, t: 10, b: 24 };
  const dated = winners.filter((w) => w.date);
  const times = dated.map((w) => Date.parse(w.date!));
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const values = dated.map((w) => w.value);
  const isTime = dated[0]?.perf.includes(":");
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  const spread = hi - lo || hi * 0.1 || 1;
  lo -= spread * 0.08;
  hi += spread * 0.08;
  const x = (d: string) => pad.l + ((Date.parse(d) - minT) / (maxT - minT || 1)) * (W - pad.l - pad.r);
  // Better is up: shorter times and longer distances sit higher.
  const y = (v: number) => {
    const share = (v - lo) / (hi - lo);
    return pad.t + (isTime ? share : 1 - share) * (H - pad.t - pad.b);
  };
  const ticks = [0, 1, 2, 3].map((i) => lo + ((hi - lo) * (i + 0.5)) / 4);
  const tickText = (v: number) => {
    if (!isTime) return String(Math.round(v));
    const m = Math.round(v / 60);
    return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
  };
  const years = Array.from(new Set(dated.map((w) => w.year).filter(Boolean))) as string[];
  const yearTicks = years.length <= 6 ? years : years.filter((_, i) => i % Math.ceil(years.length / 6) === 0);
  const line = (g: "M" | "W") =>
    dated
      .filter((w) => w.gender === g)
      .map((w) => `${x(w.date!).toFixed(1)},${y(w.value).toFixed(1)}`)
      .join(" ");
  const cur = dated.filter((w) => w.eventId === current);

  return (
    <figure className="min-w-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full text-fg-muted">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="stroke-hair" />
            <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" className="fill-fg-muted text-[11px] tabular">
              {tickText(v)}
            </text>
          </g>
        ))}
        {yearTicks.map((yr) => {
          const w = dated.find((d) => d.year === yr)!;
          return (
            <text key={yr} x={x(w.date!)} y={H - 6} textAnchor="middle" className="fill-fg-muted text-[11px] tabular">
              {yr}
            </text>
          );
        })}
        <polyline points={line("M")} fill="none" strokeWidth={1.75} className="stroke-fg" />
        <polyline points={line("W")} fill="none" strokeWidth={1.75} strokeDasharray="5 3" className="stroke-fg-muted" />
        {dated.map((w) => (
          <circle
            key={`${w.eventId}-${w.gender}`}
            cx={x(w.date!)}
            cy={y(w.value)}
            r={2.5}
            className={w.gender === "M" ? "fill-fg" : "fill-fg-muted"}
          />
        ))}
        {cur.map((w) => (
          <circle key={`cur-${w.gender}`} cx={x(w.date!)} cy={y(w.value)} r={6} fill="none" strokeWidth={2} className="stroke-brand" />
        ))}
      </svg>
      <figcaption className="mt-1 flex gap-4 text-xs text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <svg width="22" height="6" aria-hidden>
            <line x1="0" x2="22" y1="3" y2="3" strokeWidth="1.75" className="stroke-fg" />
          </svg>
          {men}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="22" height="6" aria-hidden>
            <line x1="0" x2="22" y1="3" y2="3" strokeWidth="1.75" strokeDasharray="5 3" className="stroke-fg-muted" />
          </svg>
          {women}
        </span>
      </figcaption>
    </figure>
  );
}

// ---- Race facts -------------------------------------------------------------

export async function RaceFacts({
  race,
  header,
  sameDay,
}: {
  race: LoadedRace;
  header: EventResultsHeader | null;
  sameDay: WinnerRow[];
}) {
  const t = await getTranslations("race");
  const locale = await getLocale();
  const e = race.raceDetails;
  const base = getDuvBaseUrl();
  const old = (key: string) => {
    const link = race.LinkURLs?.[key];
    return link ? resolveDuvLink(link, base) : null;
  };
  const website = toExternalUrl(e.URL ?? "");
  const email = formatEmail(cleanDuv(e.Email));
  const phone = cleanDuv(e.Phone);
  const course = formatLengthAndClimb({ length: cleanDuv(e.Length) || cleanDuv(e.Duration), climb: e.AltitudeDiff }, locale);
  const recordedBy = cleanDuv(header?.RecordedBy);
  const recordedAt = cleanDuv(header?.RecordedAt);
  const reports = (race.raceReports ?? []).map(describeLinkEntry).filter((l) => l.url);
  const oldLinks = [
    { href: old("StartPosLink"), label: t("startPositions") },
    { href: old("AllTimeLink"), label: t("allTime") },
    { href: old("MultFinishLink"), label: t("multipleFinishers") },
    { href: old("ResultLink"), label: t("oldSite") },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href));

  const left: [string, ReactNode][] = [
    [t("facts.raceType"), cleanDuv(e.RaceType)],
    [t("facts.length"), course],
    [t("facts.course"), cleanDuv(e.CourseDesc) && <LinkText value={e.CourseDesc} />],
    [t("facts.timeLimit"), cleanDuv(e.TimeLimit)],
    [t("facts.fieldLimit"), cleanDuv(e.FieldLimit)],
    [t("facts.fee"), cleanDuv(e.Fee)],
    [t("facts.rankingEligible"), e.RecordProof === "Y" ? t("facts.yes") : e.RecordProof === "N" ? t("facts.no") : ""],
    [t("facts.moreInfo"), cleanDuv(e.MoreInfo) && <LinkText value={e.MoreInfo} />],
    [t("facts.comments"), cleanDuv(e.Comments) && <LinkText value={e.Comments} />],
  ];
  const right: [string, ReactNode][] = [
    [t("facts.organiser"), [cleanDuv(e.PromOrg), cleanDuv(e.Contact)].filter(Boolean).join(" · ")],
    [
      t("facts.contact"),
      (email || phone) && (
        <>
          {email && <a href={`mailto:${email}`}>{email}</a>}
          {email && phone && " · "}
          {phone && <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>}
        </>
      ),
    ],
    [t("facts.web"), website && <OutLink href={website}>{linkHost(website)}</OutLink>],
    [
      t("facts.resultSource"),
      cleanDuv(e.ResultSource) && <LinkText value={e.ResultSource} label={t("resultSource")} />,
    ],
    [
      t("facts.recordedBy"),
      (recordedBy || recordedAt) && (
        <>
          {recordedBy}
          {recordedBy && recordedAt && ", "}
          {recordedAt && <DateText value={recordedAt} locale={locale} />}
        </>
      ),
    ],
    [
      t("facts.reports"),
      reports.length > 0 && (
        <span className="flex flex-wrap gap-x-3">
          {reports.map((r, i) => (
            <OutLink key={i} href={r.url!}>
              {r.label}
            </OutLink>
          ))}
        </span>
      ),
    ],
    [
      t("nav.sameDay"),
      sameDay.length > 0 && (
        <span className="flex flex-col">
          {sameDay.map((s) => (
            <Link key={s.EventID} href={`/events/${s.EventID}`}>
              {cleanDuv(s.EventName)}{" "}
              <span className="text-fg-muted">({t("finishers", { count: finishersOf(s) })})</span>
            </Link>
          ))}
        </span>
      ),
    ],
    [
      t("facts.links"),
      oldLinks.length > 0 && (
        <span className="flex flex-wrap gap-x-3">
          {oldLinks.map((l) => (
            <OutLink key={l.label} href={l.href}>
              {l.label}
            </OutLink>
          ))}
        </span>
      ),
    ],
  ];

  return (
    <section aria-labelledby="facts">
      <SectionHeading id="facts" className={headingClass}>
        {t("facts.heading")}
      </SectionHeading>
      <div className="mt-3 grid gap-x-9 gap-y-2 lg:grid-cols-2">
        <FactList rows={left} />
        <FactList rows={right} />
      </div>
    </section>
  );
}

function FactList({ rows }: { rows: [string, ReactNode][] }) {
  const visible = rows.filter(([, v]) => v !== "" && v !== null && v !== undefined && v !== false);
  if (!visible.length) return null;
  return (
    <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] content-start gap-x-4 gap-y-2 text-sm md:text-[0.9375rem]">
      {visible.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-fg-muted">{label}</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere] whitespace-pre-line">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
