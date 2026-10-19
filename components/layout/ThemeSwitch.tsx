"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  { value: "system", icon: Monitor },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
] as const;

/** System / Light / Dark as a three-button segmented control. */
export function ThemeSwitch({ className, showLabels = false }: { className?: string; showLabels?: boolean }) {
  const t = useTranslations("theme");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // next-themes only knows the stored theme after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const current = mounted ? (theme ?? "system") : undefined;

  return (
    <div role="group" aria-label={t("label")} className={cn("inline-flex rounded-md border border-border p-0.5", className)}>
      {options.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={current === value}
          aria-label={showLabels ? undefined : t(value)}
          title={t(value)}
          onClick={() => setTheme(value)}
          className={cn(
            "inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-sm px-2 text-xs text-fg-muted transition-colors hover:text-fg",
            current === value && "bg-surface-muted text-fg"
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
          {showLabels && t(value)}
        </button>
      ))}
    </div>
  );
}
