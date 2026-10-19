import Link from "next/link";
import { useTranslations } from "next-intl";
import { footerLinks } from "./navItems";
import { ThemeSwitch } from "./ThemeSwitch";

/** Footer, Almanac look: an ink rule, the serif wordmark, reference links, theme switch, copyright. */
export function SiteFooter() {
  const t = useTranslations("footer");
  const tSite = useTranslations("site");
  return (
    <footer className="mt-16 border-t border-fg">
      <div className="container flex flex-col gap-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:gap-6">
          <p className="flex items-baseline gap-2">
            <span className="font-serif text-lg leading-none font-bold text-brand">DUV</span>
            <span className="label-caps text-fg-muted">{tSite("tagline")}</span>
          </p>
          <ul className="flex flex-wrap gap-x-5">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-link inline-flex min-h-11 items-center text-fg-muted hover:bg-transparent hover:text-fg hover:underline md:min-h-0"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between gap-4 md:justify-end">
          <ThemeSwitch />
          <p className="text-xs text-fg-muted">{t("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
