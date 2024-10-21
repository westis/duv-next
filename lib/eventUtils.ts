// File path: lib/eventUtils.ts

import { IconType } from "react-icons";
import {
  FaStopwatch,
  FaRoute,
  FaWalking,
  FaRoad,
  FaTree,
  FaCircle,
  FaHome,
} from "react-icons/fa";

export interface Event {
  EventID: string;
  EventName: string;
  City: string;
  Country: string;
  Startdate: string;
  Length: string;
  Duration: string;
  EventType: string;
  Results: string;
  IAULabel: string;
}

const eventTypeMap: {
  [key: string]: { type: string; surface: string; number: string };
} = {
  "1": { type: "Regular", surface: "Road", number: "1" },
  "2": { type: "Regular", surface: "Trail", number: "2" },
  "3": { type: "Regular", surface: "Road", number: "3" },
  "4": { type: "Stage Race", surface: "Unknown", number: "4" },
  "5": { type: "Regular", surface: "Track", number: "5" },
  "6": { type: "Regular", surface: "Indoor", number: "6" },
  "10": { type: "Backyard Ultra", surface: "Unknown", number: "10" },
  "11": { type: "Walking", surface: "Road", number: "11" },
  "12": { type: "Walking", surface: "Road", number: "12" },
  "13": { type: "Walking", surface: "Track", number: "13" },
  "14": { type: "Walking", surface: "Indoor", number: "14" },
  "Road race": { type: "Regular", surface: "Road", number: "1" },
  "Trail race": { type: "Regular", surface: "Trail", number: "2" },
  "Road race on a loop <= 5km": {
    type: "Regular",
    surface: "Road",
    number: "3",
  },
  "Stage race": { type: "Stage Race", surface: "Unknown", number: "4" },
  Track: { type: "Regular", surface: "Track", number: "5" },
  Indoor: { type: "Regular", surface: "Indoor", number: "6" },
  "no competition": { type: "Other", surface: "Unknown", number: "0" },
  "invitational race": { type: "Other", surface: "Unknown", number: "0" },
  "Elimination race": { type: "Elimination", surface: "Unknown", number: "9" },
  "Backyard Ultra": {
    type: "Backyard Ultra",
    surface: "Unknown",
    number: "10",
  },
  "Race walking road": { type: "Walking", surface: "Road", number: "11" },
  "Race walking road loop <= 5km": {
    type: "Walking",
    surface: "Road",
    number: "12",
  },
  "Race walking track": { type: "Walking", surface: "Track", number: "13" },
  "Race walking indoor": { type: "Walking", surface: "Indoor", number: "14" },
};

export const getEventTypeNumber = (eventType: string): string => {
  const lowerEventType = eventType.toLowerCase();
  const matchingType = Object.entries(eventTypeMap).find(
    ([key, value]) =>
      key.toLowerCase() === lowerEventType || value.number === eventType
  );
  return matchingType ? matchingType[1].number : "0";
};

export const getTypeColor = (eventType: string) => {
  const typeNumber = getEventTypeNumber(eventType);
  const colors: { [key: string]: string } = {
    "1": "bg-gray-200/50 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200",
    "2": "bg-green-200/50 text-green-800 dark:bg-green-800/50 dark:text-green-200",
    "3": "bg-gray-200/50 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200",
    "4": "bg-rose-200/50 text-rose-800 dark:bg-rose-800/50 dark:text-rose-200",
    "5": "bg-red-200/50 text-red-800 dark:bg-red-800/50 dark:text-red-200",
    "6": "bg-purple-200/50 text-purple-800 dark:bg-purple-800/50 dark:text-purple-200",
    "10": "bg-violet-200/50 text-violet-800 dark:bg-violet-800/50 dark:text-violet-200",
    "11": "bg-emerald-200/50 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200",
    "12": "bg-emerald-200/50 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200",
    "13": "bg-emerald-200/50 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200",
    "14": "bg-emerald-200/50 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200",
  };

  return (
    colors[typeNumber] ||
    "bg-neutral-200/50 text-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-200"
  );
};

export const getDurationLengthColor = (event: Event) => {
  const typeNumber = getEventTypeNumber(event.EventType);
  if (typeNumber === "10") {
    return "bg-violet-200/50 text-violet-800 dark:bg-violet-800/50 dark:text-violet-200";
  }
  return event.Length
    ? "bg-blue-200/50 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200"
    : "bg-yellow-200/50 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-200";
};

export const iauLabelColors: { [key: string]: string } = {
  G: "bg-yellow-200/50 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-200",
  S: "bg-gray-200/50 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200",
  B: "bg-amber-200/50 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200",
};

export const mapEventType = (event: Event) => {
  const typeNumber = getEventTypeNumber(event.EventType);
  const eventTypeInfo = eventTypeMap[typeNumber] || {
    type: "Other",
    surface: "Unknown",
    number: "0",
  };
  let mappedType = { ...eventTypeInfo };

  if (event.Duration && mappedType.type === "Regular") {
    mappedType.type = "Fixed-time";
  } else if (event.Length && mappedType.type === "Regular") {
    mappedType.type = "Fixed-distance";
  }

  return mappedType;
};

export function getEventTypeIcon(eventType: {
  type: string;
  surface: string;
}): IconType | null {
  switch (eventType.type) {
    case "Backyard Ultra":
      return FaStopwatch;
    case "Stage Race":
      return FaRoute;
    case "Walking":
      return FaWalking;
    default:
      return null;
  }
}

export function getEventTypeLabel(eventType: {
  type: string;
  surface: string;
}) {
  return ["Backyard Ultra", "Stage Race", "Walking"].includes(eventType.type)
    ? eventType.type
    : "";
}

export function getSurfaceIcon(surface: string): IconType | null {
  switch (surface) {
    case "Road":
      return FaRoad;
    case "Trail":
      return FaTree;
    case "Track":
      return FaCircle;
    case "Indoor":
      return FaHome;
    default:
      return null;
  }
}

export function getSurfaceColor(surface: string) {
  switch (surface) {
    case "Road":
      return "bg-gray-200/50 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200";
    case "Trail":
      return "bg-green-200/50 text-green-800 dark:bg-green-800/50 dark:text-green-200";
    case "Track":
      return "bg-red-200/50 text-red-800 dark:bg-red-800/50 dark:text-red-200";
    case "Indoor":
      return "bg-purple-200/50 text-purple-800 dark:bg-purple-800/50 dark:text-purple-200";
    default:
      return "bg-neutral-200/50 text-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-200";
  }
}
