# DUV Ultramarathon Statistics Website

This repository contains the source code for a new version of the DUV (Deutsche Ultramarathon-Vereinigung) Ultramarathon Statistics website.

## Project Overview

The DUV Ultramarathon Statistics website offers:

- A calendar of upcoming ultramarathon events
- Results from past events
- Toplists and rankings for various distances and categories
- World and national records in ultrarunning
- Country-specific ultrarunning statistics

## Technologies Used

- Next.js 14+
- TypeScript
- Tailwind CSS
- shadcn/ui components

## DUV API access

All data comes from the DUV JSON API at `https://statistik.d-u-v.org/json/`, which requires a Bearer token.

1. Copy `.env.example` to `.env.local` and set `DUV_API_KEY`. `.env.local` is git-ignored; never commit the key.
2. On Vercel, add `DUV_API_KEY` as an environment variable (Production, Preview and Development).
3. Check the key with `npm run duv:check`, or open `/api/duv-status` on a running app.

The key is only read on the server. All API calls go through the typed client in `lib/duv/` (`import { getEventResults } from "@/lib/duv"`), which adds the `Authorization` header, parses the API's quirky responses and sets cache lifetimes per endpoint. Do not call `statistik.d-u-v.org` directly from components or route handlers.
