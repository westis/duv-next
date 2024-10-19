// components/providers.tsx
"use client";

import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { TheNavbar } from "@/components/layout/TheNavbar";
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
