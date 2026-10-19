import Image from "next/image";
import { Activity, Calendar, Flag, Home, MapPin, Trophy, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { NlsText, PersonHeader } from "@/lib/duv";
import { clean, httpsUrl } from "./format";

const badgeClass =
  "text-xs sm:text-sm px-2 py-1 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 w-fit";

export function RunnerHeader({
  header,
  nls = {},
}: {
  header: PersonHeader;
  nls?: NlsText;
}) {
  const origName = clean(header.OrigName);
  const club = clean(header.Club);
  const residence = clean(header.Residence);
  const homepage = clean(header.Homepage);
  const misc = clean(header.Misc);
  const born = clean(header.DOB) || clean(header.YOB);

  return (
    <Card>
      <CardHeader className="bg-yellow-500 text-black p-2 sm:p-3">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center">
          {header.PersonName}
          {origName && (
            <span className="block text-sm sm:text-base font-normal">
              {origName}
            </span>
          )}
        </h1>
      </CardHeader>
      <CardContent className="p-4 sm:pt-6 bg-white dark:bg-[#1c1c1c] text-black dark:text-white">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            {club && (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                <span>{club}</span>
              </div>
            )}
            {residence && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                <span>{residence}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span>
                {header.NationalityLong} ({header.NationalityShort})
              </span>
              {header.Flag && (
                <Image
                  src={httpsUrl(header.Flag)}
                  alt=""
                  width={24}
                  height={16}
                  className="object-contain"
                />
              )}
            </div>
            {homepage && (
              <div className="flex items-center space-x-2">
                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                <a
                  href={homepage.startsWith("http") ? homepage : `https://${homepage}`}
                  className="hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {homepage}
                </a>
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-2">
            {born && (
              <Badge variant="secondary" className={badgeClass}>
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline text-yellow-500" />
                <span>
                  {nls.nlsBirthday ?? "Born"}: {born}
                </span>
              </Badge>
            )}
            {clean(header.CatNAT) && (
              <Badge variant="secondary" className={badgeClass}>
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline text-yellow-500" />
                <span>
                  {nls.nlsAgeGroupNational ?? "Cat. national"}: {header.CatNAT}
                </span>
              </Badge>
            )}
            {clean(header.CatINT) && (
              <Badge variant="secondary" className={badgeClass}>
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline text-yellow-500" />
                <span>
                  {nls.nlsAgeGroupShortINT ?? "Cat. internat."}: {header.CatINT}
                </span>
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span>Total events: {header.TotalEvtCnt}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span>Total distance: {header.TotalKm}</span>
            </div>
          </div>
        </div>
        {misc && (
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-medium">{nls.nlsMisc ?? "Miscellaneous"}:</span>{" "}
            {misc}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
