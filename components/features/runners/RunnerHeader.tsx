import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DateText, formatBirthDate, formatCount, linkHost } from "@/lib/format";
import { LinkText, MetaDot, OutLink, PageHeader, StatStrip, StatTile } from "@/components/design";
import type { PersonHeader } from "@/lib/duv";
import { clean } from "./format";

export interface CareerFigures {
  events: number | null;
  km: number | null;
  firstSeason: string | null;
  lastSeason: string | null;
  wins: number;
}

/**
 * Identity and the four big figures (career ledger): kicker with the DUV id,
 * the name as "Aleksandr SOROKIN", one meta line (nation, birth date,
 * category, residence, club), then events, kilometres, seasons and wins.
 */
export function RunnerHeader({
  personId,
  header,
  name,
  figures,
}: {
  personId: string;
  header: PersonHeader;
  name: string;
  figures: CareerFigures;
}) {
  const t = useTranslations("runner");
  const locale = useLocale();
  const origName = clean(header.OrigName);
  const club = clean(header.Club);
  const residence = clean(header.Residence);
  const homepage = clean(header.Homepage);
  const misc = clean(header.Misc);
  const homepageUrl = homepage && (/^https?:\/\//i.test(homepage) ? homepage : `https://${homepage}`);
  // DUV's unknown "00.00.0000" shows nothing; a known year alone shows the year.
  const born = formatBirthDate(header.DOB, locale) ? header.DOB : header.YOB;
  const hasBorn = !!formatBirthDate(born, locale);
  const nat = clean(header.NationalityShort);
  const catNat = clean(header.CatNAT);
  const catInt = clean(header.CatINT);

  const meta: ReactNode[] = [];
  if (nat) {
    meta.push(
      <Link
        href={`/countries/${encodeURIComponent(nat)}`}
        className="font-semibold tracking-[0.04em] text-fg underline-offset-4 hover:underline"
        title={clean(header.NationalityLong) || undefined}
      >
        {nat}
      </Link>
    );
  }
  if (hasBorn) {
    meta.push(
      <span>
        {t("born")} <DateText value={born} locale={locale} variant="birth" />
      </span>
    );
  }
  if (catInt || catNat) {
    meta.push(
      <span>
        {catInt && catNat && catInt !== catNat
          ? t("categories", { intl: catInt, national: catNat })
          : catInt || catNat}
      </span>
    );
  }
  if (residence) meta.push(<span>{residence}</span>);
  if (club) meta.push(<span>{t("club", { club })}</span>);
  if (homepageUrl) meta.push(<OutLink href={homepageUrl}>{linkHost(homepageUrl)}</OutLink>);

  const seasons =
    figures.firstSeason && figures.lastSeason
      ? figures.firstSeason === figures.lastSeason
        ? figures.firstSeason
        : `${figures.firstSeason}–${figures.lastSeason}`
      : "–";

  return (
    <>
      <PageHeader
        kicker={t("kicker", { id: personId })}
        title={name}
        subtitle={origName || undefined}
        meta={
          meta.length
            ? meta.map((item, i) => (
                // The dot trails its item, so a wrapped line never starts with one.
                <span key={i} className="inline-flex items-center gap-x-2">
                  {item}
                  {i < meta.length - 1 && <MetaDot />}
                </span>
              ))
            : undefined
        }
        facts={
          <StatStrip>
            <StatTile label={t("facts.events")} value={formatCount(figures.events, locale) ?? "–"} />
            <StatTile
              label={t("facts.km")}
              value={figures.km !== null ? formatCount(Math.round(figures.km), locale) : "–"}
            />
            <StatTile label={t("facts.seasons")} value={seasons} />
            <StatTile label={t("facts.wins")} value={formatCount(figures.wins, locale) ?? "0"} />
          </StatStrip>
        }
      />
      {misc && (
        <p className="mt-3 max-w-prose text-sm text-fg-muted">
          <span className="font-medium text-fg">{t("misc")}:</span> <LinkText value={misc} />
        </p>
      )}
    </>
  );
}
