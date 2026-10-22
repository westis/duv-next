import Link from "next/link";
import { useTranslations } from "next-intl";
import { footerLinks } from "./navItems";
import { ThemeSwitch } from "./ThemeSwitch";

/**
 * Footer, Swiss Grid look: a heavy ink rule, the logo and site name in condensed
 * capitals, the reference links as condensed labels, then a hairline over the
 * theme switch and copyright. Rules only, no boxes.
 */
export function SiteFooter() {
  const t = useTranslations("footer");
  const tSite = useTranslations("site");
  return (
    <footer className="mt-16 border-t-[length:var(--rule-heavy)] border-fg">
      <div className="container py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
          <p className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static logo, no optimisation needed */}
            <img src="/duv_logo_with_name.png" alt="" width={60} height={28} className="h-7 w-auto dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element -- small static logo, no optimisation needed */}
            <img src="/duv_logo_with_name_white.png" alt="" width={51} height={24} className="hidden h-6 w-auto dark:block" />
            <span className="label-caps text-fg">{tSite("tagline")}</span>
          </p>
          <ul className="flex flex-wrap gap-x-6">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-link label-caps inline-flex min-h-11 items-center text-fg-muted hover:bg-transparent hover:text-fg hover:underline hover:underline-offset-4"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
          <ThemeSwitch />
          <p className="text-xs text-fg-muted">{t("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
