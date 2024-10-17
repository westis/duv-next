// components/GlobalKeyboardShortcuts.tsx
"use client";

import { useEffect } from "react";

export function GlobalKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchButton = document.querySelector(
          'button[aria-label="Open search"]'
        ) as HTMLElement;
        if (searchButton) {
          searchButton.click();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
