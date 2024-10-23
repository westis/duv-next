import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseUrl() {
  // For API routes, we want to use the deployment URL or localhost
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
}
