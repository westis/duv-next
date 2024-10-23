import { useState, useEffect } from "react";

interface Result {
  rank: string;
  performance: string;
  performanceNumeric: string;
  name: string; // This will now contain the formatted name
  club: string;
  nationality: string;
  yearOfBirth: string;
  dob: string;
  sex: string;
  ageGradePerf: string;
  rankMW: string;
  cat: string;
  rankCat: string;
  personId: string;
}

interface EventInfo {
  Resultsource: string;
  RecordedBy: string;
  EvtType: string;
  AltitudeDiff?: string;
  // Add other properties as needed
}

export function useEventResults(eventId: string | undefined) {
  const [results, setResults] = useState<Result[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setError("Event ID is missing");
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/eventResults?eventId=${eventId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setResults(data.results);
        setEventInfo(data.eventInfo);
        setError(null);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to load results: ${errorMessage}`);
        setResults([]);
        setEventInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [eventId]);

  return { results, eventInfo, loading, error };
}
