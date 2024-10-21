import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="py-8 px-4 sm:py-12 sm:px-6 lg:py-16 lg:px-8">
      <div className="container mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
          DUV Ultramarathon Statistics
        </h1>
        <p className="mt-3 mx-auto text-lg sm:text-xl md:text-2xl text-muted-foreground sm:mt-5 md:mt-5 max-w-prose">
          Discover comprehensive statistics, results, and rankings from 100,523
          ultramarathon events, featuring 8,865,545 performances by 2,115,800
          runners worldwide.
        </p>
        <div className="mt-8 sm:mt-10 md:mt-12">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5 max-w-4xl mx-auto">
            <Button
              asChild
              className="text-sm sm:text-base md:text-lg py-4 sm:py-6"
            >
              <Link href="/events?year=futur" className="btn-link">
                Calendar
              </Link>
            </Button>
            <Button
              asChild
              className="text-sm sm:text-base md:text-lg py-4 sm:py-6"
            >
              <Link href="/events?year=past1" className="btn-link">
                Results
              </Link>
            </Button>
            <Button
              asChild
              className="text-sm sm:text-base md:text-lg py-4 sm:py-6"
            >
              <Link href="/toplists" className="btn-link">
                Toplists
              </Link>
            </Button>
            <Button
              asChild
              className="text-sm sm:text-base md:text-lg py-4 sm:py-6"
            >
              <Link href="/records" className="btn-link">
                Records
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
