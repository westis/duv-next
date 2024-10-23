// hooks/useUrlParamSync.ts

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function useUrlParamSync(filters: any) {
  const router = useRouter();
  const prevFiltersRef = useRef(filters);

  useEffect(() => {
    if (JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current)) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          if (key === "dateRange" && value) {
            params.set(
              "from",
              (value as any).from?.toISOString().split("T")[0] || ""
            );
            params.set(
              "to",
              (value as any).to?.toISOString().split("T")[0] || ""
            );
          } else {
            params.set(key, String(value));
          }
        }
      });

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.push(newUrl, { scroll: false });
      prevFiltersRef.current = filters;
    }
  }, [filters, router]);
}
