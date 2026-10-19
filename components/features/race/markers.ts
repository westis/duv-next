import "server-only";
import { after } from "next/server";
import { getTranslations } from "next-intl/server";
import { formatDate, formatPerformanceText } from "@/lib/format";
import { getRaceMarkers, markerKey, type MarkRef, type RecordMarkerInfo } from "@/lib/records";
import type { MarkerKind } from "@/components/design";
import { formatRaceLength } from "@/lib/tags";
import type { Finisher } from "./raceModel";

/**
 * The record sources (IAU page, GOMU sheets, DUV's lists per age band, area
 * and nation) take long to load on a cold cache. The page waits this long for
 * them and renders without markers otherwise, letting the lookups finish after
 * the response so the next render (revalidation) has them.
 */
const MARKER_BUDGET_MS = 20000;

function withBudget<T>(work: Promise<T>): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      // Let the lookups finish after the response so they land in the data cache.
      after(() => work.then(() => undefined, () => undefined));
      resolve(null);
    }, MARKER_BUDGET_MS);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/** One marker as the lists draw it: the label parts and the popover text. */
export interface RowMarker {
  kind: MarkerKind;
  category?: string;
  body?: "IAU" | "GOMU";
  text: string;
}

/**
 * Record (WR / AR / NR, with age groups) and course record markers for the
 * finishers of one race, keyed by `markerKey(eventId, personId)`. A row gets
 * at most one open and one age group record marker, plus the CR. Never throws:
 * without the record sources the lists simply show no markers.
 */
export async function raceMarkers(
  eventId: string,
  finishers: Finisher[],
  date: string | null,
  locale: string
): Promise<Map<string, RowMarker[]>> {
  const out = new Map<string, RowMarker[]>();
  let found;
  try {
    found = await withBudget(getRaceMarkers(
      eventId,
      finishers.map((f) => ({
        eventId,
        personId: f.row.PersonID,
        perf: f.row.Performance,
        gender: f.gender,
        nat: f.row.Nationality,
        cat: f.row.Cat,
        date,
      }))
    ));
  } catch (error) {
    console.error(`[race] markers for ${eventId} failed`, error);
    return out;
  }
  if (!found) return out;
  const t = await getTranslations("race");

  const mark = (m: MarkRef) => `${formatPerformanceText(m.perf, locale)}, ${m.holder}${m.year ? ` (${m.year})` : ""}`;

  const recordText = (m: RecordMarkerInfo) => {
    const title =
      m.scope === "world"
        ? t("marker.world")
        : m.scope === "area"
          ? t("marker.area", { area: areaName(m.scopeCode) })
          : t("marker.nation", { nat: m.scopeCode });
    const dist = formatRaceLength(m.dist);
    const what = m.category ? t("marker.whatCat", { cat: m.category, dist }) : t("marker.what", { dist, gender: m.gender });
    const parts = [`${title}, ${what}.`];
    const body = m.ratifiedBy;
    if (m.status === "ratified" && body) {
      parts.push(t("marker.ratified", { body }));
      const updated = m.sourceUpdated ? formatDate(m.sourceUpdated, locale)?.text : null;
      if (updated) parts.push(t("marker.source", { body, date: updated }));
    } else if (m.status === "beatsRatified" && body) {
      if (m.ratified) parts.push(t("marker.beats", { body, mark: mark(m.ratified) }));
      if (m.best) parts.push(t("marker.best", { mark: mark(m.best) }));
    } else if (m.status === "pending" && body) {
      parts.push(t("marker.pending", { body }));
    } else {
      parts.push(t("marker.duvBest"));
      if (!body) parts.push(m.scope === "nation" ? t("marker.nationNote") : t("marker.notRatified"));
      else if (m.ratified) parts.push(t("marker.ratifiedOther", { body, mark: mark(m.ratified) }));
      else parts.push(t("marker.notRatified"));
    }
    if (m.pending && m.status !== "pending" && body) parts.push(t("marker.pending", { body }));
    return parts.join(" ");
  };

  const areaName = (code: string) => {
    const known = ["EUR", "ASI", "AFR", "NAM", "SAM", "OCE"] as const;
    const hit = known.find((k) => k === code);
    return hit ? t(`areas.${hit}`) : code;
  };

  for (const f of finishers) {
    const key = markerKey(eventId, f.row.PersonID);
    const list: RowMarker[] = [];
    const records = found.records.get(key) ?? [];
    const open = records.find((m) => !m.category);
    const age = records.find((m) => m.category);
    for (const m of [open, age]) {
      if (!m) continue;
      list.push({
        kind: m.kind,
        category: m.category,
        body: m.tier === "outlined" ? m.body : undefined,
        text: recordText(m),
      });
    }
    const cr = found.course.get(key);
    if (cr) {
      const p = cr.previous;
      list.push({
        kind: "CR",
        text: `${t("marker.course")} ${t("marker.previous", {
          mark: `${formatPerformanceText(p.perf, locale)}, ${p.name}${p.year ? ` (${p.year})` : ""}`,
        })}`,
      });
    }
    if (list.length) out.set(key, list);
  }
  return out;
}
