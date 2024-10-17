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
  const colors = [
    "bg-neutral-100 text-neutral-800",
    "bg-green-100 text-green-800",
    "bg-neutral-200 text-neutral-700",
    "bg-pink-100 text-pink-800",
    "bg-orange-100 text-orange-800",
    "bg-indigo-100 text-indigo-800",
    "bg-purple-100 text-purple-800",
    "bg-yellow-100 text-yellow-800",
    "bg-teal-100 text-teal-800",
    "bg-cyan-100 text-cyan-800",
  ];
  const index = parseInt(typeNumber) - 1;
  return colors[index] || colors[0];
};

export const getDurationLengthColor = (event: Event) => {
  return event.Length
    ? "bg-sky-100 text-sky-800"
    : "bg-amber-100 text-amber-800";
};

export const iauLabelColors: { [key: string]: string } = {
  G: "bg-yellow-100 text-yellow-800",
  S: "bg-gray-100 text-gray-800",
  B: "bg-amber-100 text-amber-800",
};

export const mapEventType = (event: Event) => {
  const types: { [key: string]: { type: string; surface: string } } = {
    "1": { type: "Regular", surface: "Road" },
    "2": { type: "Regular", surface: "Track" },
    "3": { type: "Regular", surface: "Trail" },
    "4": { type: "Regular", surface: "Desert" },
    "14": { type: "Backyard Ultra", surface: "Unknown" },
    "13": { type: "Elimination Race", surface: "Unknown" },
    "12": { type: "Stage Race", surface: "Unknown" },
  };
  return types[event.EventType] || { type: "Regular", surface: "Unknown" };
};
