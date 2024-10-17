// components/providers.tsx
"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { TheNavbar } from "@/components/the-navbar";
import { GlobalKeyboardShortcuts } from "@/components/GlobalKeyboardShortcuts";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <GlobalKeyboardShortcuts />
      <TheNavbar />
      {children}
    </ThemeProvider>
  );
}
