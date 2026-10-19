import "server-only";

// Low-level client for the DUV statistics JSON API.
// Server-only: the API key must never reach the browser bundle.

const DEFAULT_BASE_URL = "https://statistik.d-u-v.org/json";

export type DuvEndpoint =
  | "testjson.php"
  | "mbestperfcountry.php"
  | "mcalendar.php"
  | "meventdetail.php"
  | "mgetintbestlist.php"
  | "mrankingbackyard.php"
  | "mgetresultevent.php"
  | "mgetresultperson.php"
  | "msearchevent.php"
  | "msearchrunner.php"
  | "mtoprankabroad.php";

export type DuvParamValue = string | number | boolean | null | undefined;
export type DuvParams = Record<string, DuvParamValue>;

export interface DuvFetchOptions {
  /** Seconds to cache in the Next.js data cache. `false` disables caching. */
  revalidate?: number | false;
  tags?: string[];
  signal?: AbortSignal;
}

export class DuvApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: DuvEndpoint
  ) {
    super(message);
    this.name = "DuvApiError";
  }
}

export function getDuvBaseUrl() {
  return (process.env.DUV_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

let warnedMissingKey = false;

function getApiKey() {
  const key = process.env.DUV_API_KEY;
  if (!key && !warnedMissingKey) {
    warnedMissingKey = true;
    console.warn(
      "[duv] DUV_API_KEY is not set; requests are sent without authentication."
    );
  }
  return key;
}

/** Booleans become 1/0, empty values are dropped. */
export function buildDuvUrl(endpoint: DuvEndpoint, params: DuvParams = {}) {
  const url = new URL(`${getDuvBaseUrl()}/${endpoint}`);
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    const str =
      typeof value === "boolean" ? (value ? "1" : "0") : String(value);
    url.searchParams.set(name, str);
  }
  return url;
}

/**
 * Parses a DUV response body. Handles the quirks the PHP backend has shown:
 * a UTF-8 BOM, an empty body or `null`, and PHP warnings printed before the JSON.
 */
export function parseDuvBody(text: string): unknown {
  const body = text.replace(/^﻿/, "").trim();
  if (!body || body === "null") return null;
  try {
    return JSON.parse(body);
  } catch {
    // Drop PHP warnings/notices (HTML ending in <br />) printed before the JSON
    const json = body.replace(/^[\s\S]*<br\s*\/?>/i, "").trim();
    const candidates = [json, `{${json}}`]; // `"Races":null` without braces
    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch {
        /* try next */
      }
    }
    throw new SyntaxError("Response is not valid JSON");
  }
}

/**
 * Fetches a DUV endpoint and returns the parsed JSON, or `null` when the API
 * returns an empty result. Throws `DuvApiError` on HTTP or auth failures.
 */
export async function duvFetch<T>(
  endpoint: DuvEndpoint,
  params: DuvParams = {},
  { revalidate = 3600, tags, signal }: DuvFetchOptions = {}
): Promise<T | null> {
  const url = buildDuvUrl(endpoint, params);
  const key = getApiKey();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (key) headers.Authorization = `Bearer ${key}`;

  const res = await fetch(url, {
    headers,
    signal,
    ...(revalidate === false
      ? { cache: "no-store" as const }
      : { next: { revalidate, tags } }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new DuvApiError(
      `DUV ${endpoint} responded ${res.status}`,
      res.status,
      endpoint
    );
  }

  let data: unknown;
  try {
    data = parseDuvBody(text);
  } catch {
    throw new DuvApiError(`DUV ${endpoint} returned invalid JSON`, 502, endpoint);
  }

  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    (data as { error: unknown }).error === "Unauthorized"
  ) {
    throw new DuvApiError(`DUV ${endpoint}: unauthorized`, 401, endpoint);
  }

  return data as T | null;
}
