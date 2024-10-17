// components/GlobalKeyboardShortcuts.tsx
"use client";

import { useEffect } from "react";

export function GlobalKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const button = document.querySelector(
          'button[aria-haspopup="dialog"]'
        ) as HTMLElement;
        if (button) {
          button.click();
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
