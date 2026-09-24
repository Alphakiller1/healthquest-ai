# HealthQuest AI

Educational wellness app for adults in the United States. It explains food, movement, sleep, and habits. It does not diagnose, prescribe, or replace a clinician.

## Phase

Phase 0 is the safety and privacy foundation: schema, row-level security, consent and age rules, an evidence registry, and a deterministic emergency screen that runs before any model call.

Meal logging, USDA lookup, and the assistant journey are not built yet.

## Local setup

```bash
npm install
npm test
npm run dev
```

Copy `.env.example` to `.env.local` when you have Supabase, OpenAI, and USDA keys. The app runs without those keys. Production must not invent nutrition or medical facts if a provider is missing.

Python is not used. Node.js 20.9+ is required; this repo was checked on Node 24.

## Stack checked on 2026-09-24

- Next.js 16.3.2 App Router, `proxy.ts` for session refresh
- Supabase `@supabase/ssr` with `getClaims()`
- OpenAI default model `gpt-5.6-luna` ($0.20 / $1.20 per million tokens). API data is not used for training unless the org opts in. Zero Data Retention is not enabled. Requests should set `store: false`.
- USDA FoodData Central default limit: 1,000 requests per hour per IP

## Scripts

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
