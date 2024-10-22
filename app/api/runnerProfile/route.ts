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

    // Filter out empty fields and SearchRslts from PersonHeader
    const filteredPersonHeader = Object.fromEntries(
      Object.entries(data.PersonHeader).filter(([key, value]) => {
        return key !== "SearchRslts" && value !== "" && value !== "&nbsp;";
      })
    );

    // Transform the data to match the expected structure
    const transformedData = {
      PersonHeader: filteredPersonHeader,
      AllPerfs: data.AllPerfs,
      AllPBs: data.AllPBs,
      CompTable: data.CompTable,
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error fetching runner data:", error);
    return NextResponse.json(
      { error: "Failed to fetch runner data" },
      { status: 500 }
    );
  }
}
