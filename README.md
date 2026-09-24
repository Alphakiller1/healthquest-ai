# HealthQuest AI

Educational wellness app for adults in the United States. It explains food, movement, sleep, and habits. It does not diagnose, prescribe, or replace a clinician.

## Phase

Phases 0–3 run locally without API keys: demo sign-in, onboarding, meal logging, movement, habits, lessons, quests, and My Health Factors. Health factors explain topics, store optional family-history categories, and show a 7-day log of what you entered. They do not calculate a risk score. Production does not use the demo account or sample nutrients. Set `USDA_FOODDATA_API_KEY` and `OPENAI_API_KEY` to switch those providers on. Supabase magic-link sign-in is wired, but meal storage still uses the local demo file until a Supabase project is connected.

## Local setup

```bash
npm install
npm test
npm run dev
```

Copy `.env.example` to `.env.local` when you have Supabase, OpenAI, and USDA keys. The app runs without those keys. Production must not invent nutrition or medical facts if a provider is missing.

Python is not used. Node.js 20.9+ is required; this repo was checked on Node 24.

## Stack checked on 2026-09-24

- Next.js 16.3.6 App Router, `proxy.ts` for session refresh. 16.3.2 had a critical Windows/image advisory; 16.3.6 audits clean.
- Supabase `@supabase/ssr` with `getClaims()`
- OpenAI default model `gpt-5.6-luna` ($0.20 / $1.20 per million tokens). API data is not used for training unless the org opts in. Zero Data Retention is not enabled. Requests should set `store: false`.
- USDA FoodData Central default limit: 1,000 requests per hour per IP

## Scripts

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Tester access on the deployed build

Until email sign-in is live, testers sign in with any email plus a shared access code. It turns on only when all of these are set in Vercel production:

- `TESTER_ACCESS_CODE` (16+ characters) and `TESTER_SESSION_SECRET` (32+ characters)
- Upstash Redis (`KV_REST_API_URL` / `KV_REST_API_TOKEN`, added by the Vercel Upstash integration). Vercel instances don't share disk, so the demo store lives in Redis there.

It switches off automatically once `NEXT_PUBLIC_SUPABASE_URL` is set. The Redis store keeps the whole demo database in one key, and the last write wins, which is fine for a few testers but not for real users. Server actions that write must be wrapped in `withPersist`, and a write outside one throws.
