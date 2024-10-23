import useSWR from "swr";

interface Country {
  value: string;
  label: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch countries: ${response.status}`);
  }
  return response.json();
};

export function useCountries() {
  const { data, error } = useSWR<Country[]>("/api/countries", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 3600000, // 1 hour
  });

  return {
    countries: data || [],
    isLoading: !error && !data,
    error: error,
  };
}
