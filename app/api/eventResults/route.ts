import { NextResponse } from "next/server";

interface ResultItem {
  RankTotal: string;
  Performance: string;
  PerformanceNumeric: string;
  FirstName: string;
  LastName: string;
  Club: string;
  Nationality: string;
  YOB: string;
  DOB: string;
  Gender: string;
  AgeGradePerf: string;
  RankMW: string;
  Cat: string;
  RankCat: string;
  PersonID: string;
}

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

    const formattedResults = data.Resultlist.map((result: ResultItem) => ({
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

    return NextResponse.json({
      results: formattedResults,
      eventInfo: data.EvtHeader,
    });
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
