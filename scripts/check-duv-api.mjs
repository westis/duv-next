// Usage: DUV_API_KEY=... npm run duv:check
// Calls the DUV auth test endpoint and one data endpoint with the key.
const base = (process.env.DUV_API_BASE_URL || "https://statistik.d-u-v.org/json").replace(/\/$/, "");
const key = process.env.DUV_API_KEY;

if (!key) {
  console.error("DUV_API_KEY is not set");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${key}`, Accept: "application/json" };

for (const path of ["testjson.php", "mgetresultevent.php?event=134760&cat=W&plain=1"]) {
  const res = await fetch(`${base}/${path}`, { headers });
  const text = (await res.text()).replace(/^﻿/, "");
  console.log(`${res.status} ${path}\n  ${text.slice(0, 200).replace(/\s+/g, " ")}`);
}
