"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, Monitor, Search, X } from "lucide-react";
import { SearchDialog } from "@/components/SearchDialog";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { footerLinks, isSectionActive, navSections } from "./navItems";
import { ThemeSwitch } from "./ThemeSwitch";

type SearchResult = { type: "runner" | "event"; id: string; name: string; details: string };
type SearchType = "all" | "runner" | "event";

function useSiteSearch() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [type, setType] = useState<SearchType>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalHits, setTotalHits] = useState(0);
  const debounced = useDebounce(term, 300);
  const active = debounced.length >= 3;

  useEffect(() => {
    if (debounced.length < 3) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- shows the spinner while the request runs
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debounced)}&type=${type}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setResults(data.results ?? []);
        setTotalHits(data.totalHits ?? 0);
      })
      .catch(() => {
        if (cancelled) return;
        setResults([]);
        setTotalHits(0);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced, type]);

  // "/" or Cmd/Ctrl+K opens search from anywhere, except while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable=true]");
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const dialog = (
    <SearchDialog
      open={open}
      onOpenChange={setOpen}
      searchTerm={term}
      onSearchTermChange={setTerm}
      searchType={type}
      onSearchTypeChange={setType}
      searchResults={active ? results : []}
      loading={active && loading}
      totalHits={active ? totalHits : 0}
    />
  );
  return { open: useCallback(() => setOpen(true), []), dialog };
}

function Logo() {
  const t = useTranslations("site");
  return (
    <Link href="/" className="nav-link relative block h-8 w-[84px] shrink-0 hover:bg-transparent" aria-label={t("home")}>
      <Image src="/duv_logo_with_name.png" alt="" fill sizes="84px" priority className="logo-light object-contain object-left" />
      <Image src="/duv_logo_with_name_white.png" alt="" fill sizes="84px" priority className="logo-dark object-contain object-left" />
    </Link>
  );
}

/** Sticky 56 px site header (design spec, "Site header"). */
export function SiteHeader() {
  const t = useTranslations("nav");
  const tTheme = useTranslations("theme");
  const pathname = usePathname();
  const search = useSiteSearch();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-surface">
      <div className="container flex h-full items-center gap-4">
        <Logo />

        <nav aria-label={t("mainNavigation")} className="hidden h-full lg:block">
          <ul className="flex h-full items-stretch gap-1">
            {navSections.map((section) => {
              const active = isSectionActive(section, pathname);
              return (
                <li key={section.key} className="flex">
                  <Link
                    href={section.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "nav-link flex items-center border-b-2 px-3 text-sm font-medium hover:bg-transparent",
                      active ? "border-brand text-fg" : "border-transparent text-fg-muted hover:text-fg"
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
            className="hidden h-9 w-64 items-center gap-2 rounded-md border border-border bg-bg px-3 text-sm text-fg-muted hover:text-fg lg:flex xl:w-80"
          >
            <Search className="size-4" strokeWidth={1.75} aria-hidden />
            <span className="truncate">{t("searchPlaceholder")}</span>
            <kbd className="ms-auto rounded-sm border border-border px-1.5 text-xs">/</kbd>
          </button>
          <button
            type="button"
            onClick={search.open}
            aria-label={t("search")}
            className="inline-flex size-11 items-center justify-center rounded-md text-fg hover:bg-surface-muted lg:hidden"
          >
            <Search className="size-5" strokeWidth={1.75} aria-hidden />
          </button>

          <Popover>
            <PopoverTrigger
              aria-label={tTheme("label")}
              className="hidden size-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted hover:text-fg lg:inline-flex"
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
      {search.dialog}
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
        className="inline-flex size-11 items-center justify-center rounded-md text-fg hover:bg-surface-muted lg:hidden"
      >
        <Menu className="size-5" strokeWidth={1.75} aria-hidden />
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full max-w-sm flex-col gap-0 overflow-y-auto p-0 [&>button:last-child]:hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <SheetTitle className="text-base font-semibold">{t("menu")}</SheetTitle>
          <SheetClose
            aria-label={t("closeMenu")}
            className="inline-flex size-11 items-center justify-center rounded-md hover:bg-surface-muted"
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
                  className="nav-link flex min-h-11 items-center rounded-md px-3 text-base font-semibold"
                >
                  {t(section.key)}
                </Link>
                {section.children && (
                  <ul className="ms-3 border-s border-border">
                    {section.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className="nav-link flex min-h-11 items-center rounded-md px-3 text-sm text-fg-muted"
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
        <div className="mt-auto space-y-4 border-t border-border px-4 py-4">
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
