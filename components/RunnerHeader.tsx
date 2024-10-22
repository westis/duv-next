import React, { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  MapPin,
  Flag,
  Calendar,
  Trophy,
  Activity,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  [key: string]: string; // Allow for additional properties
}

export function RunnerHeader({ runnerInfo }: { runnerInfo: RunnerInfo }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-8">
      <CardHeader className="bg-yellow-500 text-black p-2 sm:p-3">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center">
          {runnerInfo.PersonName}
        </h1>
      </CardHeader>
      <CardContent className="p-4 sm:pt-6 bg-white dark:bg-[#1c1c1c] text-black dark:text-white">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span>{runnerInfo.Club}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span>{runnerInfo.Residence}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span>
                {runnerInfo.NationalityLong} ({runnerInfo.NationalityShort})
              </span>
              <Image
                src={runnerInfo.Flag}
                alt={`Flag of ${runnerInfo.NationalityShort}`}
                width={24}
                height={16}
                className="object-contain"
              />
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Badge
              variant="secondary"
              className="text-xs sm:text-sm px-2 py-1 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 w-fit"
            >
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline text-yellow-500" />
              <span>Born: {runnerInfo.DOB || runnerInfo.YOB}</span>
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs sm:text-sm px-2 py-1 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 w-fit"
            >
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline text-yellow-500" />
              <span>NAT: {runnerInfo.CatNAT}</span>
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs sm:text-sm px-2 py-1 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 w-fit"
            >
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline text-yellow-500" />
              <span>INT: {runnerInfo.CatINT}</span>
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span>Total Events: {runnerInfo.TotalEvtCnt}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span>Total Distance: {runnerInfo.TotalKm}</span>
            </div>
          </div>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="flex items-center justify-center w-full py-2 text-sm font-medium text-yellow-600 dark:text-yellow-500 hover:underline">
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Hide additional information
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show additional information
              </>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-4">
            {Object.entries(runnerInfo).map(([key, value]) => {
              if (
                ![
                  "PersonName",
                  "Club",
                  "Residence",
                  "NationalityShort",
                  "NationalityLong",
                  "YOB",
                  "DOB",
                  "CatNAT",
                  "CatINT",
                  "TotalEvtCnt",
                  "TotalKm",
                  "Flag",
                ].includes(key)
              ) {
                return (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                  </div>
                );
              }
              return null;
            })}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
