"use client";

import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { TheNavbar } from "@/components/layout/TheNavbar";
import { GlobalKeyboardShortcuts } from "@/components/GlobalKeyboardShortcuts";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [systemTheme, setSystemTheme] = useState<"light" | "dark" | undefined>(
    undefined
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    const handler = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      forcedTheme={systemTheme}
    >
      <GlobalKeyboardShortcuts />
      <TheNavbar />
      {children}
    </ThemeProvider>
  );
}
