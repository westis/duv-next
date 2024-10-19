// File path: lib/event-utils.ts

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

export const getTypeColor = (typeNumber: string) => {
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
  if (event.EventType === "10") {
    // Backyard Ultra
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
  const types: { [key: string]: { type: string; surface: string } } = {
    "1": { type: "Regular", surface: "Road" },
    "2": { type: "Regular", surface: "Trail" },
    "3": { type: "Regular", surface: "Road" },
    "4": { type: "Stage Race", surface: "Unknown" },
    "5": { type: "Regular", surface: "Track" },
    "6": { type: "Regular", surface: "Indoor" },
    "10": { type: "Backyard Ultra", surface: "Unknown" },
    "11": { type: "Walking", surface: "Road" },
    "12": { type: "Walking", surface: "Road" },
    "13": { type: "Walking", surface: "Track" },
    "14": { type: "Walking", surface: "Indoor" },
  };
  const mapped = types[event.EventType] || {
    type: "Other",
    surface: "Unknown",
  };
  if (event.Duration && mapped.type === "Regular") {
    mapped.type = "Fixed-time";
  } else if (event.Length && mapped.type === "Regular") {
    mapped.type = "Fixed-distance";
  }
  return mapped;
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
