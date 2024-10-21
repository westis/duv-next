import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { error: "Event ID is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://statistik.d-u-v.org/json/mgetresultevent.php?event=${eventId}&plain=1&Language=EN`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.Resultlist)) {
      console.error("Unexpected data structure:", data);
      return NextResponse.json(
        { error: "Invalid data format received from the API" },
        { status: 500 }
      );
    }

    const formattedResults = data.Resultlist.map((result: any) => ({
      rank: result.RankTotal,
      performance: result.Performance,
      name: result.AthleteName,
      club: result.Club,
      nationality: result.Nationality,
      yearOfBirth: result.YOB,
      sex: result.Gender,
      ageGradePerf: result.AgeGradePerf,
    }));

    return NextResponse.json(formattedResults);
  } catch (error: unknown) {
    console.error("Error fetching event results:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch event results",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
