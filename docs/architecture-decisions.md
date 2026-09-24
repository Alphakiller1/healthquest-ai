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

## 2026-09-24 — USDA lookup uses a local api.data.gov key

Food search calls `https://api.nal.usda.gov/fdc/v1/foods/search` and prefers Foundation and SR Legacy foods. Energy is read from nutrient 1008, then Atwater 2047 or 2048, because Foundation records often omit 1008. Results are cached by FoodData Central id under `.data/`. The signup form at api.data.gov requires a captcha, so local development uses USDA’s published `DEMO_KEY` in `.env.local` (30 requests per hour). That file is gitignored. Replace it with a registered key before any shared deployment.

## 2026-09-24 — Local demo accounts until Supabase is configured

Sign-in, onboarding, meals, and XP persist in `.data/demo-store.json` only when `NODE_ENV` is not production and Supabase env vars are absent. The UI labels this as a local demo. Production without Supabase or a USDA key does not invent accounts or nutrient values. When `USDA_FOODDATA_API_KEY` or `OPENAI_API_KEY` is set, that provider is used instead of the demo fixture.

## 2026-09-24 — Health factors stay descriptive

My Health Factors lists influenceable habits, age, and optional family-history categories. The family note stores a category id only, not a relative’s name. The 7-day table counts meals, movement minutes, and sleep hours the user entered. It does not label a day as improving, declining, or risky. Education-only contexts see general lessons, not sodium or blood-pressure targets framed as their plan. New lesson sources (MedlinePlus family history, sodium, and fiber; NHLBI high blood pressure; NIMH stress) returned HTTP 200 on 2026-09-24.

## 2026-09-24 — Daily explanation cap and USDA request cap

`AI_DAILY_LIMIT_FREE` defaults to 30. After that, meals still save and still earn XP, and the explanation says the cap was reached. The model is not called. USDA searches stop before the published hourly cap (30 for `DEMO_KEY`, 1,000 otherwise) and return a busy message instead of guessing nutrients. Sentry is not initialized.

## 2026-09-24 — Later phases stay educational

Phases 5–25 add participation marks, a visit-question list, editable goals, plain-language lesson order, weekly quest points, and meal removal. Removing a meal does not delete points. An emergency sentence in a visit question is not stored. Wearables, labs, grocery prices, photos, voice, community, family accounts, and genetic data stay out of scope.

## 2026-09-24 — shadcn/ui waits for the first interactive product UI

Phase 0 uses semantic HTML and Tailwind so unused component kits are not generated. Radix/shadcn comes with onboarding and journal forms.
