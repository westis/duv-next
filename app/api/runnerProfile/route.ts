import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const personId = searchParams.get("personId");

  if (!personId) {
    return NextResponse.json(
      { error: "Person ID is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://statistik.d-u-v.org/json/mgetresultperson.php?runner=${personId}&Language=EN`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch runner data");
    }

    const data = await response.json();

    const filteredPersonHeader = Object.fromEntries(
      Object.entries(data.PersonHeader).filter(([key, value]) => {
        return key !== "SearchRslts" && value !== "" && value !== "&nbsp;";
      })
    );

    const transformedData = {
      PersonHeader: filteredPersonHeader,
      AllPerfs: data.AllPerfs,
      AllPBs: data.AllPBs,
      CompTable: data.CompTable,
    };

    return NextResponse.json(transformedData, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error fetching runner data:", error);
    return NextResponse.json(
      { error: "Failed to fetch runner data" },
      { status: 500 }
    );
  }
}
