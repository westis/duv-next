import { getCountry } from "@/components/features/countries/data";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ nat: string }>;
}

/**
 * Checks the country code for every country route: a code DUV does not list
 * is a 404 here, above any loading boundary, so the status stays 404. Each
 * page draws its own header.
 */
export default async function CountryLayout({ children, params }: LayoutProps) {
  await getCountry((await params).nat);
  return children;
}
