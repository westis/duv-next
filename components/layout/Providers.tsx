"use client";

import { ThemeProvider } from "@/components/layout/ThemeProvider";
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
      {children}
    </ThemeProvider>
  );
}
