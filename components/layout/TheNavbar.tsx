"use client";

import React, { useState, memo, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Search } from "lucide-react";
import { MobileNav } from "@/components/layout/TheMobileNav";
import { Navigation, navigationItems } from "@/components/layout/Navigation";
import { SearchDialog } from "@/components/SearchDialog";
import { useDebounce } from "@/hooks/useDebounce";

type SearchResult = {
  type: "runner" | "event";
  id: string;
  name: string;
  details: string;
};

type SearchType = "all" | "runner" | "event";

const TheNavbar = memo(function TheNavbar() {
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalHits, setTotalHits] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const searchItems = useCallback(async (query: string, type: SearchType) => {
    if (query.length < 3) {
      setSearchResults([]);
      setTotalHits(0);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=${type}`
      );
      const data = await response.json();

      setTotalHits(data.totalHits);
      setSearchResults(data.results);
    } catch (error) {
      console.error("Error fetching search results:", error);
      setSearchResults([]);
      setTotalHits(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchItems(debouncedSearchTerm, searchType);
    } else {
      setSearchResults([]);
      setTotalHits(0);
    }
  }, [debouncedSearchTerm, searchItems, searchType]);

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleSearchTypeChange = useCallback((value: SearchType) => {
    setSearchType(value);
  }, []);

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between py-2 md:py-4">
        <Link href="/" className="flex items-center">
          <div className="relative w-[100px] h-[40px] md:w-[120px] md:h-[48px]">
            <Image
              src="/duv_logo_with_name.png"
              alt="DUV Logo Light"
              fill
              className="logo-light object-contain"
            />
            <Image
              src="/duv_logo_with_name_white.png"
              alt="DUV Logo Dark"
              fill
              className="logo-dark object-contain"
            />
          </div>
        </Link>

        <div className="hidden lg:block">
          <Navigation />
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="relative w-[140px] sm:w-[200px] lg:w-80">
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal text-sm md:text-base text-muted-foreground group"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="truncate">Search runner, event, club...</span>
              <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex group-hover:bg-accent">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-base md:text-lg"
          >
            <Sun className="h-[1.5rem] w-[1.5rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.5rem] w-[1.5rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <MobileNav items={navigationItems} />
        </div>
      </div>

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        searchTerm={searchTerm}
        onSearchTermChange={handleSearchTermChange}
        searchType={searchType}
        onSearchTypeChange={handleSearchTypeChange}
        searchResults={searchResults}
        loading={loading}
        totalHits={totalHits}
      />
    </nav>
  );
});

TheNavbar.displayName = "TheNavbar";

export { TheNavbar };
