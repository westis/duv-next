"use client";

import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/design";

export default function CountryError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("states");
  console.error(error);
  return (
    <div className="container py-8">
      <EmptyState
        action={
          <button type="button" onClick={reset} className="inline-flex h-11 items-center border border-fg px-4 text-sm font-medium">
            {t("retry")}
          </button>
        }
      >
        {t("error")}
      </EmptyState>
    </div>
  );
}
