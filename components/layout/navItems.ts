import type { Messages } from "next-intl";

type NavKey = keyof Messages["nav"];
type FooterKey = keyof Messages["footer"];

export interface NavSection {
  key: NavKey;
  href: string;
  /** Paths that make this section active. */
  match: string[];
  children?: { key: NavKey; href: string }[];
}

/** The four primary sections (design spec, "Primary navigation"). */
export const navSections: NavSection[] = [
  {
    key: "races",
    href: "/events",
    match: ["/events"],
    children: [
      { key: "calendar", href: "/events" },
      { key: "recentResults", href: "/events?year=past1" },
      { key: "championships", href: "/championships" },
    ],
  },
  {
    key: "rankings",
    href: "/rankings",
    match: ["/rankings"],
    children: [
      { key: "internationalRankings", href: "/rankings" },
      { key: "backyardRankings", href: "/rankings/backyard" },
    ],
  },
  { key: "records", href: "/records", match: ["/records"] },
  { key: "countries", href: "/countries", match: ["/countries"] },
];

export const footerLinks: { key: FooterKey; href: string }[] = [
  { key: "about", href: "/about" },
  { key: "faq", href: "/faq" },
  { key: "whatsNew", href: "/whatsnew" },
  { key: "credits", href: "/credits" },
  { key: "contact", href: "/contact" },
];

export function isSectionActive(section: NavSection, pathname: string) {
  return section.match.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
