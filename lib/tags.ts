/**
 * Turns DUV race fields into the ordered tag list every page shows
 * (design spec, "Tags"). Labels are message keys under `tags.*`; the
 * distance tag carries its own text because it is a figure, not a word.
 */

export type TagFamily = "distance" | "type" | "surface" | "iau" | "championship" | "status";

/** Message keys under `tags`, e.g. "type.fixedTime". */
export type TagMessageKey =
  | `type.${"fixedDistance" | "fixedTime" | "backyard" | "stageRace" | "elimination" | "invitational" | "walking"}`
  | `surface.${"road" | "trail" | "track" | "indoor"}`
  | `iau.${"G" | "S" | "B" | "T"}`
  | `championship.${"world" | "continental" | "national"}`
  | `status.${"C" | "P" | "S" | "N" | "rankingEligible"}`;

export type TagSpec =
  | { family: "distance"; text: string }
  | { family: Exclude<TagFamily, "distance">; key: TagMessageKey; tone?: TagTone };

/** Colour variant inside a family: IAU metals and status dots. */
export type TagTone = "gold" | "silver" | "bronze" | "success" | "warning" | "muted";

const FAMILY_ORDER: TagFamily[] = ["distance", "type", "surface", "iau", "championship", "status"];

type Kind = "regular" | "stageRace" | "invitational" | "elimination" | "backyard" | "walking";
type Surface = "road" | "trail" | "track" | "indoor";

/** DUV EventType codes (meventdetail / mcalendar). */
const EVENT_TYPES: Record<string, { kind: Kind; surface?: Surface }> = {
  "1": { kind: "regular", surface: "road" },
  "2": { kind: "regular", surface: "trail" },
  "3": { kind: "regular", surface: "road" },
  "4": { kind: "stageRace" },
  "5": { kind: "regular", surface: "track" },
  "6": { kind: "regular", surface: "indoor" },
  "8": { kind: "invitational" },
  "9": { kind: "elimination" },
  "10": { kind: "backyard" },
  "11": { kind: "walking", surface: "road" },
  "12": { kind: "walking", surface: "road" },
  "13": { kind: "walking", surface: "track" },
  "14": { kind: "walking", surface: "indoor" },
};

export interface TaggableRace {
  EventType?: string | null;
  Length?: string | null;
  Duration?: string | null;
  IAULabel?: string | null;
  Results?: string | null;
  RecordProof?: string | null;
}

/**
 * "100km" → "100 km", "24h" → "24 h", "50mi" → "50 mi", "6d" → "6 d".
 * Unknown shapes come back trimmed and unchanged.
 */
export function formatRaceLength(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  const match = value.match(/^(\d+(?:[.,]\d+)?)\s*(km|mi|h|d|m)\.?$/i);
  if (!match) return value;
  return `${match[1]} ${match[2].toLowerCase()}`;
}

export function raceTypeOf(eventType: string | null | undefined) {
  return EVENT_TYPES[String(eventType ?? "").trim()] ?? null;
}

export interface RaceTagOptions {
  /** Add the results status tag (calendar rows). */
  status?: boolean;
  /** Add "Ranking eligible" when RecordProof is Y. */
  rankingEligible?: boolean;
}

export function raceTags(race: TaggableRace, options: RaceTagOptions = {}): TagSpec[] {
  const tags: TagSpec[] = [];
  const type = raceTypeOf(race.EventType);
  const length = formatRaceLength(race.Length);
  const duration = formatRaceLength(race.Duration);

  if (type?.kind !== "backyard" && (length || duration)) {
    tags.push({ family: "distance", text: length || duration });
  }

  if (type) {
    const kindKey: Record<Kind, TagMessageKey | null> = {
      regular: duration && !length ? "type.fixedTime" : length ? "type.fixedDistance" : null,
      stageRace: "type.stageRace",
      invitational: "type.invitational",
      elimination: "type.elimination",
      backyard: "type.backyard",
      walking: "type.walking",
    };
    const key = kindKey[type.kind];
    if (key) tags.push({ family: "type", key });
    if (type.surface) tags.push({ family: "surface", key: `surface.${type.surface}` });
  }

  const iau = (race.IAULabel ?? "").trim().toUpperCase();
  if (iau === "G" || iau === "S" || iau === "B" || iau === "T") {
    const tone: Record<string, TagTone> = { G: "gold", S: "silver", B: "bronze", T: "muted" };
    tags.push({ family: "iau", key: `iau.${iau}`, tone: tone[iau] });
  }

  if (options.status) {
    const results = (race.Results ?? "").trim().toUpperCase();
    const tone: Record<string, TagTone> = { C: "success", S: "success", P: "warning", N: "muted" };
    if (results === "C" || results === "P" || results === "S" || results === "N") {
      tags.push({ family: "status", key: `status.${results}`, tone: tone[results] });
    }
  }
  if (options.rankingEligible && race.RecordProof === "Y") {
    tags.push({ family: "status", key: "status.rankingEligible", tone: "success" });
  }

  return sortTags(tags);
}

export function sortTags(tags: TagSpec[]): TagSpec[] {
  return [...tags].sort((a, b) => FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family));
}
