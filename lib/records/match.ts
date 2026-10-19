// Gives ratified marks (IAU, GOMU) their DUV ids. Neither body lists DUV ids.
//
// 1. The run: a DUV list entry with the same discipline, gender, start date and
//    performance (within 10 m or 1 s) is the same run → PersonID and EventID.
// 2. The holder: the same full date of birth and the same name (accents, case
//    and word order aside), nationality only ruling candidates out, and only
//    when exactly one DUV runner fits. Anything else stays unmatched and is
//    reported, never guessed.
import { isSameMark } from "./disciplines";
import { dobIso, nameKey } from "./text";
import type { DuvBest, RatifiedMark } from "./types";

const DAY_MS = 86_400_000;

/**
 * The same start day, allowing one day either way: the IAU page and DUV
 * sometimes date a race that starts in the evening or crosses midnight
 * differently (Doha 2014: IAU 22.11., DUV 21.11.). The performance must
 * still agree within 10 m or 1 s.
 */
function sameStart(mark: RatifiedMark, date: string | null): boolean {
  if (!mark.date || !date) return false;
  return Math.abs(Date.parse(date) - Date.parse(mark.date)) <= DAY_MS;
}

/** Step 1: match by run (start day within one day, same mark). Returns new objects; marks already matched are kept. */
export function matchRuns(marks: RatifiedMark[], duv: DuvBest[]): RatifiedMark[] {
  return marks.map((mark) => {
    if (mark.personId) return mark;
    const runs = duv.filter(
      (d) => d.dist === mark.dist && d.gender === mark.gender && sameStart(mark, d.date) && isSameMark(d.value, mark.value, mark.dist)
    );
    const people = new Set(runs.map((d) => `${d.personId}:${d.eventId}`));
    if (people.size !== 1) return mark;
    return { ...mark, personId: runs[0].personId, eventId: runs[0].eventId, matchedBy: "run" as const };
  });
}

/** A DUV runner as the holder matching sees one (from msearchrunner + mgetresultperson). */
export interface HolderCandidate {
  personId: string;
  firstName: string;
  lastName: string;
  /** Full date of birth as DUV shows it ("16.01.1979"); a year alone never matches. */
  dob: string;
  nat: string;
  /** The runner's results, to find the EventID of the record run. */
  perfs?: { eventId: string; date: string | null; value: number | null }[];
}

/**
 * Step 2 for one mark: the one candidate with the same full birth date and name.
 * Null when none or more than one fits.
 */
export function pickHolder(mark: RatifiedMark, candidates: HolderCandidate[]): HolderCandidate | null {
  const dob = dobIso(mark.dob);
  const name = nameKey(mark.holder);
  if (!dob || !name) return null;
  const fits = new Map<string, HolderCandidate>();
  for (const c of candidates) {
    if (dobIso(c.dob) !== dob) continue;
    if (mark.nat && c.nat && mark.nat !== c.nat.toUpperCase()) continue;
    if (nameKey(`${c.firstName} ${c.lastName}`) !== name) continue;
    fits.set(c.personId, c);
  }
  return fits.size === 1 ? Array.from(fits.values())[0] : null;
}

/** Applies a picked holder: PersonID, and the EventID when the run is among their results. */
export function applyHolder(mark: RatifiedMark, holder: HolderCandidate): RatifiedMark {
  const run = (holder.perfs ?? []).filter(
    (p) => p.date === mark.date && p.value !== null && isSameMark(p.value, mark.value, mark.dist)
  );
  const events = new Set(run.map((p) => p.eventId));
  return {
    ...mark,
    personId: holder.personId,
    eventId: events.size === 1 ? run[0].eventId : null,
    matchedBy: "holder",
  };
}

/** One log line for a mark that stays unmatched (Vercel logs). */
export function unmatchedLine(mark: RatifiedMark): string {
  const band = mark.category === "Overall" ? mark.scopeCode : mark.category;
  return `[records] unmatched ${mark.body} ${mark.status} ${mark.dist} ${mark.gender} ${band}: ${mark.holder} ${mark.perfRaw} ${mark.date ?? "no date"}`;
}
