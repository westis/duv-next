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
    "1": "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    "2": "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200",
    "3": "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    "4": "bg-rose-200 text-rose-800 dark:bg-rose-800 dark:text-rose-200",
    "5": "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200",
    "6": "bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200",
    "10": "bg-violet-200 text-violet-800 dark:bg-violet-800 dark:text-violet-200",
    "11": "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200",
    "12": "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200",
    "13": "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200",
    "14": "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200",
  };
  return (
    colors[typeNumber] ||
    "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
  );
};

export const getDurationLengthColor = (event: Event) => {
  if (event.EventType === "10") {
    // Backyard Ultra
    return "bg-violet-200 text-violet-800 dark:bg-violet-800 dark:text-violet-200";
  }
  return event.Length
    ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
    : "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200";
};

export const iauLabelColors: { [key: string]: string } = {
  G: "bg-yellow-200 text-yellow-800",
  S: "bg-gray-200 text-gray-800",
  B: "bg-amber-200 text-amber-800",
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
