import { redirect } from "next/navigation";
import { parseNat } from "@/components/features/countries/data";

export default async function CountryPage({
  params,
}: {
  params: Promise<{ nat: string }>;
}) {
  const nat = parseNat((await params).nat);
  redirect(`/countries/${nat}/records`);
}
