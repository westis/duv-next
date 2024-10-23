import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, ClipboardList, Trophy, Award } from "lucide-react";

interface HeroProps {
  title: string;
  subtitle: string;
}

export default function Hero({ title, subtitle }: HeroProps) {
  const currentDate = new Date();
  const oneYearFromNow = new Date(currentDate);
  oneYearFromNow.setFullYear(currentDate.getFullYear() + 1);

  const oneYearAgo = new Date(currentDate);
  oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  return (
    <div className="py-12 sm:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-foreground text-center mb-8">
          {title}
        </h1>
        <div className="lg:flex lg:items-start lg:justify-between">
          <div className="lg:w-1/2 space-y-6 mb-8 lg:mb-0">
            <p className="text-lg sm:text-xl text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <div className="lg:w-1/2 lg:pl-8">
            <div className="grid grid-cols-2 gap-4">
              <Button
                asChild
                variant="default"
                size="lg"
                className="w-full text-sm sm:text-base"
              >
                <Link
                  href={`/events?from=${formatDate(
                    currentDate
                  )}&to=${formatDate(oneYearFromNow)}`}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Calendar
                </Link>
              </Button>
              <Button
                asChild
                variant="default"
                size="lg"
                className="w-full text-sm sm:text-base"
              >
                <Link
                  href={`/events?from=${formatDate(oneYearAgo)}&to=${formatDate(
                    currentDate
                  )}`}
                >
                  <ClipboardList className="mr-2 h-5 w-5" />
                  Results
                </Link>
              </Button>
              <Button
                asChild
                variant="default"
                size="lg"
                className="w-full text-sm sm:text-base"
              >
                <Link href="/toplists">
                  <Trophy className="mr-2 h-5 w-5" />
                  Toplists
                </Link>
              </Button>
              <Button
                asChild
                variant="default"
                size="lg"
                className="w-full text-sm sm:text-base"
              >
                <Link href="/records">
                  <Award className="mr-2 h-5 w-5" />
                  Records
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
