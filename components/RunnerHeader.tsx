import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Flag, Calendar, Trophy } from "lucide-react";

interface RunnerInfo {
  PersonName: string;
  Club: string;
  Residence: string;
  YOB: string;
  DOB: string;
  NationalityShort: string;
  NationalityLong: string;
  Flag: string;
  CatNAT: string;
  CatINT: string;
  TotalEvtCnt: string;
  TotalKm: string;
}

export function RunnerHeader({ runnerInfo }: { runnerInfo: RunnerInfo }) {
  return (
    <Card className="mb-8">
      <CardHeader className="bg-primary text-primary-foreground p-2 sm:p-3">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center">
          {runnerInfo.PersonName}
        </h1>
      </CardHeader>
      <CardContent className="p-4 sm:pt-6 bg-card text-card-foreground">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-sm sm:text-base">{runnerInfo.Club}</span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-sm sm:text-base text-muted-foreground">
                {runnerInfo.Residence}
              </span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-sm sm:text-base">
                {runnerInfo.NationalityLong} ({runnerInfo.NationalityShort})
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs sm:text-sm px-2 py-1 rounded-full"
            >
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
              <span>Born: {runnerInfo.DOB || runnerInfo.YOB}</span>
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs sm:text-sm px-2 py-1 rounded-full"
            >
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
              <span>National Category: {runnerInfo.CatNAT}</span>
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs sm:text-sm px-2 py-1 rounded-full"
            >
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
              <span>International Category: {runnerInfo.CatINT}</span>
            </Badge>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span className="text-sm sm:text-base">
              Total Events: {runnerInfo.TotalEvtCnt}
            </span>
            <span className="text-sm sm:text-base">
              Total Distance: {runnerInfo.TotalKm}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
