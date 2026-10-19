/**
 * Continent of each IOC country code DUV uses, for the directory's columns and
 * the country page's breadcrumb. Geography only; a code missing here is listed
 * under "other" rather than dropped.
 */
export type Continent = "europe" | "asia" | "africa" | "northAmerica" | "southAmerica" | "oceania" | "other";

export const CONTINENT_ORDER: Continent[] = [
  "europe",
  "asia",
  "africa",
  "northAmerica",
  "southAmerica",
  "oceania",
  "other",
];

const CODES: Record<Exclude<Continent, "other">, string> = {
  europe:
    "ALB AND ARM AUT AZE BEL BIH BLR BUL CRO CYP CZE DEN ESP EST FIN FRA FRO GBR GEO GER GIB GRE HUN IRL ISL ITA KOS LAT LIE LTU LUX MDA MKD MLT MNE MON NED NOR POL POR ROU RUS SMR SRB SLO SUI SVK SWE TUR UKR",
  asia:
    "AFG BAN BHU BRN BRU CAM CHN HKG IND INA IRI IRQ ISR JOR JPN KAZ KGZ KOR KSA KUW LAO LBN MAC MAS MDV MGL MYA NEP OMA PAK PHI PLE PRK QAT SGP SRI SYR THA TJK TKM TLS TPE UAE UZB VIE YEM",
  africa:
    "ALG ANG BDI BEN BOT BUR CAF CGO CHA CIV CMR COD COM CPV DJI EGY ERI ETH GAB GAM GHA GBS GEQ GUI KEN LBA LBR LES MAD MAR MAW MLI MOZ MRI MTN NAM NGR NIG RSA RWA SEN SEY SLE SOM SSD STP SUD SWZ TAN TOG TUN UGA ZAM ZIM",
  northAmerica:
    "ANT ARU BAH BAR BER BIZ CAN CAY CRC CUB DMA DOM ESA GRD GRL GUA HAI HON ISV IVB JAM LCA MEX NCA PAN PUR SKN TRI USA VIN",
  southAmerica: "ARG BOL BRA CHI COL ECU GUY PAR PER SUR URU VEN",
  oceania: "ASA ATA AUS COK FIJ FSM GUM KIR MHL NCL NRU NZL PLW PNG PYF SAM SOL TGA TUV VAN",
};

const BY_CODE = new Map<string, Continent>(
  (Object.entries(CODES) as [Exclude<Continent, "other">, string][]).flatMap(([continent, codes]) =>
    codes.split(" ").map((code) => [code, continent] as const)
  )
);

export function continentOf(code: string): Continent {
  return BY_CODE.get(code.toUpperCase()) ?? "other";
}
