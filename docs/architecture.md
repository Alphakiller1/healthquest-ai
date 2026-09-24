# Architecture

Next.js App Router. Domain logic lives in `src/lib` and is tested without the UI.

Request path for a future assistant call:

1. Normalize text
2. Emergency safety check. On a hit, return a fixed template and do not call the model
3. Restricted-context check (`education_only` is the stricter mode)
4. Select relevant context and active evidence IDs
5. Nutrition lookup only through the USDA adapter, later
6. Build a minimal payload (no email, name, or auth id)
7. Model, server-side only
8. Zod validation, prohibited-pattern check, citation check
9. One retry, then a fixed fallback

Supabase holds user data. The browser uses the anon key. The service role stays on the server. Session refresh uses `src/proxy.ts` and `auth.getClaims()`, matching current Supabase Next.js guidance.

Gamification totals come from `gamification_events`. Clients cannot insert those rows.

Local development may use mock providers. Production must fail closed when USDA or OpenAI keys are missing.
