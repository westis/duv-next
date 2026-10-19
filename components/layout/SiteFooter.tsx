import Link from "next/link";
import { useTranslations } from "next-intl";
import { footerLinks } from "./navItems";
import { ThemeSwitch } from "./ThemeSwitch";

/** Compact footer: reference links, theme switch, copyright. */
export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="container flex flex-col gap-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {footerLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="nav-link text-fg-muted hover:bg-transparent hover:text-fg">
                {t(link.key)}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-4 md:justify-end">
          <ThemeSwitch />
          <p className="text-xs text-fg-muted">{t("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
