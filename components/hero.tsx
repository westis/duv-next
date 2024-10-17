import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl md:text-6xl">
          DUV Ultramarathon Statistics
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Discover comprehensive statistics, results, and rankings from 100,523
          ultramarathon events, featuring 8,865,545 performances by 2,115,800
          runners worldwide.
        </p>
        <div className="mt-10 max-w-md mx-auto sm:flex sm:justify-center md:mt-12">
          <div className="grid grid-cols-2 gap-3 sm:max-w-xl sm:mx-auto md:grid-cols-4 md:gap-5">
            <Button asChild>
              <Link href="/events?year=futur">Calendar</Link>
            </Button>
            <Button asChild>
              <Link href="/events?year=past">Results</Link>
            </Button>
            <Button asChild>
              <Link href="/toplists">Toplists</Link>
            </Button>
            <Button asChild>
              <Link href="/records">Records</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
