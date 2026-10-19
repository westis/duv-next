import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isAreaCode, RecordsView } from "@/components/features/records/RecordsView";

export const revalidate = 86400;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function scopeOf(sp: Record<string, string | string[] | undefined>): string {
  const raw = Array.isArray(sp.scope) ? sp.scope[0] : sp.scope;
  return (raw ?? "").trim().toUpperCase();
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const t = await getTranslations("records");
  const scope = scopeOf(await searchParams);
  return {
    title: isAreaCode(scope) ? t("metaTitleArea", { area: t(`areas.${scope}`) }) : t("metaTitleWorld"),
    description: t("metaDescription"),
  };
}

/** World records, or a continent's (`?scope=EUR`); a country's live on its country page. */
export default async function RecordsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const scope = scopeOf(sp);
  if (/^[A-Z]{3}$/.test(scope) && !isAreaCode(scope)) {
    // The scope switch without JavaScript submits ?scope=SWE here.
    const params = new URLSearchParams();
    for (const key of ["dist", "type", "cat"]) {
      const value = sp[key];
      if (typeof value === "string" && value) params.set(key, value);
    }
    const qs = params.toString();
    redirect(`/countries/${scope}/records${qs ? `?${qs}` : ""}`);
  }
  return (
    <RecordsView scope={isAreaCode(scope) ? { kind: "area", code: scope } : { kind: "world" }} searchParams={sp} />
  );
}
