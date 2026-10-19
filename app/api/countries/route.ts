import { NextResponse } from "next/server";
import { getCalendar } from "@/lib/duv";

export async function GET() {
  try {
    const data = await getCalendar({ perpage: 1 }, { revalidate: 86400 });
    const values = data?.FltCountryValues ?? [];
    const labels = data?.FltCountryLabels ?? [];

    const countries = values.map(
      (value: string, index: number) => ({
        value,
        label: labels[index],
        searchTerms: `${value} ${labels[index]}`.toLowerCase(),
      })
    );

    return NextResponse.json(countries);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch countries." },
      { status: 500 }
    );
  }
}
