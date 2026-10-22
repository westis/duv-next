"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, Monitor, Search, X } from "lucide-react";
import { QuickSearch } from "@/components/features/search/QuickSearch";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { footerLinks, isSectionActive, navSections } from "./navItems";
import { ThemeSwitch } from "./ThemeSwitch";

/**
 * Quick search state: "/" or Cmd/Ctrl+K opens it from anywhere (except "/" while
 * typing). Open, it takes over the header (`QuickSearch`); closing returns focus
 * to where it was, and moving to another page closes it.
 */
function useSiteSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const returnFocus = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    if (document.activeElement?.closest("[data-quick-search]")) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => returnFocus.current?.focus?.());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable=true]");
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        open();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // A new page closes the search.
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    if (isOpen) setIsOpen(false);
  }

  const panel = isOpen ? <QuickSearch onClose={close} /> : null;
  return { isOpen, open, panel };
}

/** The white DUV logo (the band is dark in both themes) and the site's name in condensed capitals. */
function Wordmark() {
  const t = useTranslations("site");
  return (
    <Link
      href="/"
      aria-label={t("home")}
      className="nav-link flex shrink-0 items-center gap-3 py-1 text-header-fg hover:bg-transparent hover:text-header-fg"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small static logo, no optimisation needed */}
      <img src="/duv_logo_with_name_white.png" alt="" width={77} height={36} className="h-8 w-auto lg:h-9" />
      <span aria-hidden className="label-caps max-w-[5.5rem] text-header-fg sm:hidden">
        {t("taglineShort")}
      </span>
      <span aria-hidden className="label-caps hidden text-header-fg sm:inline">
        {t("tagline")}
      </span>
    </Link>
  );
}

/** Nav link on the band: condensed capitals, muted until hovered, the active one white with a red underline. */
const bandLink =
  "nav-link inline-flex min-h-11 items-center font-display text-[1.0625rem] font-semibold tracking-[0.04em] uppercase text-header-muted hover:bg-transparent hover:text-header-fg aria-[current=page]:text-header-fg aria-[current=page]:shadow-[inset_0_calc(-1*var(--rule-mid))_0_var(--brand)]";

/**
 * Site header, Swiss Grid look (design-system/components/SiteHeader.md): one band
 * in `header` (navy in light, near-black in dark) with the white logo, the four
 * sections in condensed capitals (the active one with a red underline) and an
 * underlined search field that opens the quick search ("/" or Cmd/Ctrl+K).
 * Phones keep the four sections as a row under the logo; the menu button holds
 * the subsections, theme and about links. Sticky from lg only (`--header-h`),
 * so a phone keeps its whole screen for the page.
 */
export function SiteHeader() {
  const t = useTranslations("nav");
  const tTheme = useTranslations("theme");
  const pathname = usePathname();
  const search = useSiteSearch();

  return (
    <header className="z-40 bg-header text-header-fg lg:sticky lg:top-0">
      {search.panel}
      <div className={cn("container flex items-center gap-3 pt-2 pb-1 lg:h-15 lg:gap-8 lg:py-0", search.isOpen && "lg:hidden")}>
        <Wordmark />

        <nav aria-label={t("mainNavigation")} className="hidden h-full lg:block">
          <ul className="flex h-full items-center gap-6">
            {navSections.map((section) => (
              <li key={section.key}>
                <Link
                  href={section.href}
                  aria-current={isSectionActive(section, pathname) ? "page" : undefined}
                  className={bandLink}
                >
                  {t(section.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex min-w-0 items-center gap-1 lg:gap-4">
          {/* The search field: underline only, it opens the quick search. */}
          <button
            type="button"
            onClick={search.open}
            aria-label={t("search")}
            className="flex h-9 min-w-0 items-center gap-2 border-b border-header-muted text-sm text-header-muted hover:border-header-fg hover:text-header-fg lg:w-72 xl:w-80"
          >
            <Search className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="truncate lg:hidden">{t("search")}</span>
            <span className="hidden truncate lg:inline">{t("searchPlaceholder")}</span>
            <kbd className="ms-auto hidden border border-header-muted px-1.5 font-mono text-xs lg:inline">/</kbd>
          </button>

          <Popover>
            <PopoverTrigger
              aria-label={tTheme("label")}
              className="hidden size-9 items-center justify-center text-header-muted hover:text-header-fg lg:inline-flex"
            >
              <Monitor className="size-5" strokeWidth={1.75} aria-hidden />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-2">
              <ThemeSwitch showLabels />
            </PopoverContent>
          </Popover>

          <MobileMenu />
        </div>
      </div>

      {/* Phones and tablets: the four sections stay visible as one row under the logo. */}
      <nav aria-label={t("mainNavigation")} className="lg:hidden">
        <ul className="container flex justify-between gap-2 sm:justify-start sm:gap-8">
          {navSections.map((section) => (
            <li key={section.key}>
              <Link
                href={section.href}
                aria-current={isSectionActive(section, pathname) ? "page" : undefined}
                className={cn(bandLink, "text-base")}
              >
                {t(section.key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function MobileMenu() {
  const t = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={t("openMenu")}
        className="inline-flex size-11 shrink-0 items-center justify-center text-header-fg lg:hidden"
      >
        <Menu className="size-5" strokeWidth={1.75} aria-hidden />
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full max-w-sm flex-col gap-0 overflow-y-auto p-0 [&>button:last-child]:hidden">
        <div className="flex h-14 shrink-0 items-center justify-between bg-header px-4 text-header-fg">
          <SheetTitle className="font-display text-xl font-bold tracking-[0.04em] text-header-fg uppercase">{t("menu")}</SheetTitle>
          <SheetClose
            aria-label={t("closeMenu")}
            className="inline-flex size-11 items-center justify-center text-header-fg"
          >
            <X className="size-5" strokeWidth={1.75} aria-hidden />
          </SheetClose>
        </div>
        <nav aria-label={t("mainNavigation")} className="px-2 py-3">
          <ul>
            {navSections.map((section) => (
              <li key={section.key} className="py-1">
                <Link
                  href={section.href}
                  onClick={() => setOpen(false)}
                  aria-current={isSectionActive(section, pathname) ? "page" : undefined}
                  className="nav-link flex min-h-11 items-center px-3 font-display text-lg font-semibold tracking-[0.04em] uppercase aria-[current=page]:shadow-[inset_var(--rule-mid)_0_0_var(--brand)]"
                >
                  {t(section.key)}
                </Link>
                {section.children && (
                  <ul className="ms-3 border-s border-hair">
                    {section.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className="nav-link flex min-h-11 items-center px-3 text-sm text-fg-muted"
                        >
                          {t(child.key)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto space-y-4 border-t-[length:var(--rule-mid)] border-fg px-4 py-4">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setOpen(false)} className="nav-link inline-flex min-h-11 items-center text-fg-muted">
                  {tFooter(link.key)}
                </Link>
              </li>
            ))}
          </ul>
          <ThemeSwitch showLabels />
        </div>
      </SheetContent>
    </Sheet>
  );
}
