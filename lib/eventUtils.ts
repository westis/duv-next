import { IconType } from "react-icons";
import {
  FaStopwatch,
  FaRoute,
  FaWalking,
  FaRoad,
  FaTree,
  FaCircle,
  FaHome,
  FaSkullCrossbones,
  FaHandshake,
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
  "8": { type: "Invitational", surface: "Unknown", number: "8" },
  "9": { type: "Elimination", surface: "Unknown", number: "9" },
  "10": { type: "Backyard Ultra", surface: "Unknown", number: "10" },
  "11": { type: "Walking", surface: "Road", number: "11" },
  "12": { type: "Walking", surface: "Road", number: "12" },
  "13": { type: "Walking", surface: "Track", number: "13" },
  "14": { type: "Walking", surface: "Indoor", number: "14" },
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
    "1": "bg-gray-200/50 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200", // Road
    "2": "bg-green-200/50 text-green-800 dark:bg-green-800/50 dark:text-green-200", // Trail
    "3": "bg-gray-200/50 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200", // Road (loop)
    "4": "bg-rose-200/50 text-rose-800 dark:bg-rose-800/50 dark:text-rose-200", // Stage Race
    "5": "bg-red-200/50 text-red-800 dark:bg-red-800/50 dark:text-red-200", // Track
    "6": "bg-purple-200/50 text-purple-800 dark:bg-purple-800/50 dark:text-purple-200", // Indoor
    "8": "bg-blue-200/50 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200", // Invitational
    "9": "bg-indigo-200/50 text-indigo-800 dark:bg-indigo-800/50 dark:text-indigo-200", // Elimination
    "10": "bg-violet-200/50 text-violet-800 dark:bg-violet-800/50 dark:text-violet-200", // Backyard Ultra
    "11": "bg-gray-200/50 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200", // Walking Road
    "12": "bg-gray-200/50 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200", // Walking Road (loop)
    "13": "bg-red-200/50 text-red-800 dark:bg-red-800/50 dark:text-red-200", // Walking Track
    "14": "bg-purple-200/50 text-purple-800 dark:bg-purple-800/50 dark:text-purple-200", // Walking Indoor
  };

  return (
    colors[typeNumber] ||
    "bg-neutral-200/50 text-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-200"
  );
};

export const getDurationLengthColor = (event: Event | EventTypeInput) => {
  const typeNumber =
    "EventType" in event ? getEventTypeNumber(event.EventType) : "0";
  if (typeNumber === "10") {
    return "bg-violet-200/50 text-violet-800 dark:bg-violet-800/50 dark:text-violet-200";
  }
  return "Length" in event && event.Length
    ? "bg-blue-200/50 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200"
    : "bg-yellow-200/50 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-200";
};

export const iauLabelColors: { [key: string]: string } = {
  G: "bg-yellow-200/50 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-200",
  S: "bg-gray-200/50 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200",
  B: "bg-amber-200/50 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200",
};

export interface EventTypeInput {
  EventType: string;
  Length?: string;
  Duration?: string;
}

export const mapEventType = (event: EventTypeInput) => {
  const typeNumber = getEventTypeNumber(event.EventType);
  const eventTypeInfo = eventTypeMap[typeNumber] || {
    type: "Other",
    surface: "Unknown",
    number: "0",
  };
  const mappedType = { ...eventTypeInfo };

  if (event.Duration && mappedType.type === "Regular") {
    return { ...mappedType, type: "Fixed-time" };
  } else if (event.Length && mappedType.type === "Regular") {
    return { ...mappedType, type: "Fixed-distance" };
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
    case "Elimination":
      return FaSkullCrossbones;
    case "Invitational":
      return FaHandshake;
    default:
      return null;
  }
}

export function getEventTypeLabel(eventType: {
  type: string;
  surface: string;
}) {
  if (eventType.type === "Walking") {
    return "Walking";
  }
  return [
    "Backyard Ultra",
    "Stage Race",
    "Elimination",
    "Invitational",
  ].includes(eventType.type)
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

export function shouldShowDistanceOrDuration(event: EventTypeInput): boolean {
  const mappedType = mapEventType(event);
  return mappedType.type !== "Backyard Ultra";
}

export function shouldShowSurface(eventType: string): boolean {
  const mappedType = mapEventType({ EventType: eventType });
  return mappedType.surface !== "Unknown";
}

export const getEventTypeColor = (eventType: {
  type: string;
  surface: string;
}) => {
  if (eventType.type === "Walking") {
    return "bg-sky-200/50 text-sky-800 dark:bg-sky-800/50 dark:text-sky-200";
  }
  return getTypeColor(eventType.type); // Fallback to getTypeColor for other event types
};
