import { useState, useEffect } from "react";

interface Result {
  rank: string;
  performance: string;
  name: string;
  club: string;
  nationality: string;
  yearOfBirth: string;
  sex: string;
  ageGradePerf: string;
}

export function useEventResults(eventId: string) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        setResults(data);
        setError(null);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to load results: ${errorMessage}`);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [eventId]);

  return { results, loading, error };
}
