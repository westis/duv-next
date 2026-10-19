// Small text helpers shared by the IAU and GOMU parsers and the matching.

const NAMED: Record<string, string> = {
  nbsp: " ",
  acute: "'",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  szlig: "ß",
  aelig: "æ",
  AElig: "Æ",
  oslash: "ø",
  Oslash: "Ø",
  eth: "ð",
  thorn: "þ",
};

/** Accent entities read as letter + accent name ("&uuml;", "&Aacute;"). */
const ACCENT: Record<string, string> = {
  acute: "́",
  grave: "̀",
  circ: "̂",
  uml: "̈",
  tilde: "̃",
  ring: "̊",
  cedil: "̧",
  caron: "̌",
};

export function decodeEntities(raw: string): string {
  return raw.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    if (body in NAMED) return NAMED[body];
    const accent = ACCENT[body.slice(1)];
    if (accent && /^[a-z]$/i.test(body[0])) return (body[0] + accent).normalize("NFC");
    return match;
  });
}

/** "Van Zyl, Irvette" → "Irvette Van Zyl"; names without a comma stay as written. */
export function holderName(raw: string): string {
  const name = raw.replace(/\s+/g, " ").trim();
  const comma = name.indexOf(",");
  if (comma < 0) return name;
  const last = name.slice(0, comma).trim();
  const first = name.slice(comma + 1).trim();
  return first && last ? `${first} ${last}` : name;
}

/** Name tokens without accents or case, sorted, so word order and spelling of accents do not matter. */
export function nameKey(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .sort()
    .join(" ");
}

/** A real calendar day as ISO, or null. */
export function isoDay(day: number, month: number, year: number): string | null {
  if (!day || !month || !year || year < 1900 || year > 2100) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

/** "16.01.1979", "16/01/1979" or "1979-01-16" to ISO; null for a year alone or "00.00.0000". */
export function dobIso(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  let m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) return isoDay(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return isoDay(+m[3], +m[2], +m[1]);
  return null;
}

/** "N.A.", "No record", "-": a cell that says there is nothing. */
export function isBlank(value: string | null | undefined): boolean {
  const v = String(value ?? "").trim();
  return !v || /^(n\.?\s?a\.?|no record|-+|—)$/i.test(v);
}
