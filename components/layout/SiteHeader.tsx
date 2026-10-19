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

/** The wordmark: "DUV" in the red serif, the site's name in small capitals beside it. */
function Wordmark() {
  const t = useTranslations("site");
  return (
    <Link
      href="/"
      aria-label={t("home")}
      className="nav-link flex shrink-0 items-center gap-2 py-1 hover:bg-transparent"
    >
      <span aria-hidden className="font-serif text-[1.5rem] leading-none font-bold tracking-[-0.01em] text-brand lg:text-[1.625rem]">
        DUV
      </span>
      <span aria-hidden className="label-caps max-w-[5.5rem] tracking-[0.12em] text-fg sm:hidden">
        {t("taglineShort")}
      </span>
      <span aria-hidden className="label-caps hidden tracking-[0.12em] text-fg sm:inline">
        {t("tagline")}
      </span>
    </Link>
  );
}

/**
 * Site header, Almanac look: a 4 px red line on top, the serif wordmark, the four
 * sections as plain text (the active one bold with a red underline), a wide
 * search field with the "/" shortcut, and one ink rule closing it. Phones keep
 * the four sections visible as a row under the wordmark (no hamburger for them);
 * the menu button holds the subsections, theme and about links. Sticky from lg
 * only (`--header-h`), so a phone keeps its whole screen for the page.
 */
export function SiteHeader() {
  const t = useTranslations("nav");
  const tTheme = useTranslations("theme");
  const pathname = usePathname();
  const search = useSiteSearch();

  return (
    <header className="z-40 border-t-4 border-b border-t-brand border-b-fg bg-bg lg:sticky lg:top-0">
      {search.panel}
      <div className={cn("container flex items-center gap-3 pt-2 pb-1 lg:h-14 lg:gap-7 lg:py-0", search.isOpen && "lg:hidden")}>
        <Wordmark />

        <nav aria-label={t("mainNavigation")} className="hidden h-full lg:block">
          <ul className="flex h-full items-center gap-6">
            {navSections.map((section) => {
              const active = isSectionActive(section, pathname);
              return (
                <li key={section.key}>
                  <Link
                    href={section.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "nav-link inline-flex min-h-11 items-center text-sm hover:bg-transparent hover:underline hover:underline-offset-8",
                      active && "font-semibold shadow-[inset_0_-2px_0_var(--brand)] hover:no-underline"
                    )}
                  >
                    {t(section.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-1 lg:gap-3">
          <button
            type="button"
            onClick={search.open}
            aria-label={t("search")}
            className="hidden h-9 w-72 items-center gap-2 border border-border bg-surface px-3 text-sm text-fg-muted hover:border-fg-muted hover:text-fg lg:flex xl:w-80"
          >
            <Search className="size-4" strokeWidth={1.75} aria-hidden />
            <span className="truncate">{t("searchPlaceholder")}</span>
            <kbd className="ms-auto border border-border px-1.5 font-mono text-xs">/</kbd>
          </button>
          <button
            type="button"
            onClick={search.open}
            aria-label={t("search")}
            className="inline-flex size-11 items-center justify-center text-fg hover:bg-surface-muted lg:hidden"
          >
            <Search className="size-5" strokeWidth={1.75} aria-hidden />
          </button>

          <Popover>
            <PopoverTrigger
              aria-label={tTheme("label")}
              className="hidden size-9 items-center justify-center text-fg-muted hover:bg-surface-muted hover:text-fg lg:inline-flex"
            >
              <Monitor className="size-5" strokeWidth={1.75} aria-hidden />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto rounded-none p-2">
              <ThemeSwitch showLabels />
            </PopoverContent>
          </Popover>

          <MobileMenu />
        </div>
      </div>

      {/* Phones and tablets: the four sections stay visible as one row. */}
      <nav aria-label={t("mainNavigation")} className="border-t border-hair lg:hidden">
        <ul className="container flex justify-between gap-2 sm:justify-start sm:gap-8">
          {navSections.map((section) => {
            const active = isSectionActive(section, pathname);
            return (
              <li key={section.key}>
                <Link
                  href={section.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "nav-link inline-flex min-h-11 items-center text-sm hover:bg-transparent",
                    active && "font-semibold shadow-[inset_0_-2px_0_var(--brand)]"
                  )}
                >
                  {t(section.key)}
                </Link>
              </li>
            );
          })}
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
        className="inline-flex size-11 items-center justify-center text-fg hover:bg-surface-muted lg:hidden"
      >
        <Menu className="size-5" strokeWidth={1.75} aria-hidden />
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full max-w-sm flex-col gap-0 overflow-y-auto p-0 [&>button:last-child]:hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-t-4 border-b border-t-brand border-b-fg px-4">
          <SheetTitle className="font-serif text-xl font-semibold">{t("menu")}</SheetTitle>
          <SheetClose
            aria-label={t("closeMenu")}
            className="inline-flex size-11 items-center justify-center hover:bg-surface-muted"
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
                  className="nav-link flex min-h-11 items-center px-3 font-serif text-lg font-semibold aria-[current=page]:shadow-[inset_2px_0_0_var(--brand)]"
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
        <div className="mt-auto space-y-4 border-t border-fg px-4 py-4">
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
