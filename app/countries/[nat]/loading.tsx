import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/design";

export default function Loading() {
  const t = useTranslations("states");
  return (
    <div role="status" aria-busy="true" className="container pt-7">
      <span className="sr-only">{t("loading")}</span>
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-10 w-64" />
      <Skeleton className="mt-3 h-4 w-48" />
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-fg pt-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
      <Skeleton className="mt-10 h-7 w-56" />
      <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}
