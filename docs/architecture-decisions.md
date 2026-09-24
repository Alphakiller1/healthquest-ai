# Architecture decisions

## 2026-09-24 — Phase 0 stops before product features

The first build is the safety, privacy, and schema foundation. Onboarding, meal logging, and the assistant UI are not marked done. The landing page states the product boundary and does not fake sign-up.

## 2026-09-24 — Emergency screen is deterministic and runs first

`evaluateSafety` never calls a model. Media retellings, educational questions, negations, and past family history do not match. A current emergency about another person, such as a parent having a heart attack, still shows the 911 screen because missing that case is more harmful than an extra prompt to call emergency services.

## 2026-09-24 — Citations require an HTTP-checked active source

CDC, Dietary Guidelines, AHA, and HRSA URLs returned HTTP 403 to this environment’s scripted requests. Those rows are stored as `pending_review` and cannot be cited. Only sources that returned HTTP 200 on 2026-09-24 are `active`.

## 2026-09-24 — OpenAI model and retention

Default model is `gpt-5.6-luna` from the OpenAI models page on 2026-09-24, chosen for cost. The privacy UI must not claim Zero Data Retention. Abuse-monitoring logs may retain content for up to 30 days unless the org is approved for ZDR. ZDR is not active.

## 2026-09-24 — RLS tests use PGlite

Docker and the Supabase CLI are not installed here. Policy tests run the real migration on PGlite with `auth.uid()` and `authenticated` / `anon` roles. That checks the SQL. It does not replace a hosted Supabase auth test.

## 2026-09-24 — XP writes are server-only

Authenticated users can read their own `gamification_events` and cannot insert them. Point awards will be written with the service role so the browser cannot grant XP.

## 2026-09-24 — shadcn/ui waits for the first interactive product UI

Phase 0 uses semantic HTML and Tailwind so unused component kits are not generated. Radix/shadcn comes with onboarding and journal forms.
