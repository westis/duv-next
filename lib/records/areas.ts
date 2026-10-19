import type { AreaCode } from "./types";

// IOC country codes by continent (the IAU's areas). Used to find a runner's
// area for the outlined "IAU AR" tier; DUV's own area lists need no lookup.
const BY_AREA: Record<AreaCode, string> = {
  EUR:
    "ALB AND ARM AUT AZE BEL BIH BLR BUL CRO CYP CZE DEN ESP EST FIN FRA FRO GBR GEO GER GIB GRE GRL HUN IRL ISL ISR ITA KOS LAT LIE LTU LUX MDA MKD MLT MNE MON NED NOR POL POR ROU RUS SMR SRB SLO SUI SVK SWE TUR UKR",
  ASI:
    "AFG BAN BHU BRN BRU CAM CHN HKG INA IND IRI IRQ JOR JPN KAZ KGZ KOR KSA KUW LAO LBN MAC MAS MDV MGL MYA NEP OMA PAK PHI PLE PRK QAT SGP SRI SYR TJK THA TKM TLS TPE UAE UZB VIE YEM",
  AFR:
    "ALG ANG BDI BEN BOT BUR CAF CGO CHA CIV CMR COD COM CPV DJI EGY ERI ESH ETH GAB GAM GBS GEQ GHA GUI KEN LBA LBR LES MAD MAR MAW MLI MOZ MRI MTN NAM NGR NIG RSA RWA SEN SEY SLE SOM SSD STP SUD SWZ TAN TOG TUN UGA ZAM ZIM",
  NAM:
    "AIA ANT ARU BAH BAR BER BIZ CAN CAY CRC CUB DMA DOM ESA GRN GUA HAI HON IVB JAM LCA MEX NCA PAN PUR SKN TCA TRI USA VIN ISV",
  SAM: "ARG BOL BRA CHI COL ECU GUY PAR PER SUR URU VEN",
  OCE: "ASA AUS COK FIJ FSM GUM KIR MHL NCL NRU NZL PLW PNG PYF SAM SOL TGA TUV VAN",
};

const AREA_OF = new Map<string, AreaCode>();
for (const [area, codes] of Object.entries(BY_AREA) as [AreaCode, string][]) {
  for (const code of codes.split(" ")) AREA_OF.set(code, area);
}

/** The IAU area of an IOC code, or null when unknown (neutral athletes, "---"). */
export function areaOfNation(nat: string | null | undefined): AreaCode | null {
  return AREA_OF.get(String(nat ?? "").trim().toUpperCase()) ?? null;
}

/** The IAU page's and GOMU's spellings that differ from DUV's IOC codes. */
const NAT_ALIASES: Record<string, string> = {
  JAP: "JPN",
  "AIN/RUS": "AIN",
  "ANA/RUS": "AIN",
  ENG: "GBR",
  SCO: "GBR",
  WAL: "GBR",
  UK: "GBR",
};

export function normalizeNat(raw: string | null | undefined): string | null {
  const value = String(raw ?? "").trim().toUpperCase();
  if (!value || /^(n\.?\s?a\.?|-+)$/i.test(value)) return null;
  return NAT_ALIASES[value] ?? value;
}
