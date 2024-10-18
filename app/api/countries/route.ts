import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://statistik.d-u-v.org/json/mcalendar.php"
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.status}`);
    }
    const data = await response.json();

    const countries = data.FltCountryValues.map(
      (value: string, index: number) => ({
        value,
        label: data.FltCountryLabels[index],
        searchTerms: `${value} ${data.FltCountryLabels[index]}`.toLowerCase(),
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
