import { NextResponse } from "next/server";
import { getEventResults, type EventResultRow } from "@/lib/duv";

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
    const data = await getEventResults({ event: eventId, plain: true });

    if (!data || !Array.isArray(data.Resultlist)) {
      console.error("Unexpected data structure:", data);
      return NextResponse.json(
        { error: "Invalid data format received from the API" },
        { status: 500 }
      );
    }

    const formattedResults = data.Resultlist.map((result: EventResultRow) => ({
      rank: result.RankTotal,
      performance: result.Performance,
      performanceNumeric: result.PerformanceNumeric,
      name: `${result.FirstName} ${result.LastName.toUpperCase()}`,
      club: result.Club,
      nationality: result.Nationality,
      yearOfBirth: result.YOB,
      dob: result.DOB,
      sex: result.Gender,
      ageGradePerf: result.AgeGradePerf,
      rankMW: result.RankMW,
      cat: result.Cat,
      rankCat: result.RankCat,
      personId: result.PersonID,
    }));

    return NextResponse.json(
      {
        results: formattedResults,
        eventInfo: data.EvtHeader,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
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
