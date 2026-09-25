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

## 2026-09-25 — Safety engine v2: clause-level detection with a labelled corpus

An audit found the v1 rules caught 6 of 26 realistic emergencies ("I have really bad chest pain right now", "I took 30 pills", "my son swallowed bleach", "I don't want to be alive anymore" all passed through) and fired on "what does anaphylaxis mean". Rule version 2026.09.25.2 splits text into clauses, strips negation and hyperbole per clause, and suppresses educational questions, hypotheticals, past history, and media retellings — except for **strong** rules (all self-harm, airway closing, not breathing, overdose quantities, household poisoning, face droop), which no framing can cancel, so "how do I kill myself" is never treated as a question. Adds the `poisoning` category the product prompt requires. Crisis matches win over medical because the crisis template also offers 911. `tests/unit/safety-corpus.test.ts` holds 110+ real-phrasing cases; every rule change needs a case there.

## 2026-09-25 — Evidence claims, and answers that work without a model

The model previously saw source ids with no content, so it could not ground anything. `lib/evidence/claims.ts` adds short reviewed claims per source (restating lesson content; no new medical facts). `selectEvidence` picks claims about what was asked or eaten; profile topics reorder those claims but never add unrelated ones, and an off-topic question gets no claims. A model may only state and cite what it is handed, and a citation must be a source handed in for that question. With no OpenAI key — or when the person turned AI off, or hit the daily cap — `createEvidenceAssistant` assembles the answer directly from the selected claims. Nothing is invented and nothing is sent to a third party; the UI labels it "Built from reviewed sources". When no claim matches it says HealthQuest has no reviewed material rather than guessing.

## 2026-09-25 — OpenAI adapter uses strict structured output and a corrective retry

Requests use `text.format` with a strict JSON schema (optional fields required-but-nullable), read the raw `output[].content[]`, treat refusals as failures, and time out after 20s. When validation rejects an answer, the one retry tells the model why. Output checks now cover diagnosis, labelling a person with a condition, doses, medication changes, outcome promises, personal risk numbers, moral food labels, restriction and weight-loss framing, and — in Gentle Food Mode — any calorie or weight talk.

## 2026-09-25 — Two live-site failures fixed

`countSafetyCategory` wrote to the project directory, which is read-only on Vercel, so an emergency in a meal note threw instead of showing the emergency screen. It now writes best-effort to the data directory and can never block the safety path. `saveMeal` redirected away before saving whenever nutrition lookup was unconfigured, so every meal on the live site was silently dropped; nutrition matching is now optional and a meal always saves.

## 2026-09-25 — Health profile drives the experience, deterministically

`lib/profile/profile.ts` adds optional answers — activity baseline and a self-chosen weekly movement goal, typical sleep, grocery budget, eating pattern, smoking — alongside the existing goals, health topics, Gentle Food Mode, and plain language. Each field is collected only because something uses it, and the profile page says what each one changes; height and weight are not collected because nothing uses them. `lib/profile/personalize.ts` turns the profile into topic weights with plain reasons and uses them to size quests (movement target from the goal or baseline; a longer sleep quest when sleep is short or uneven), rank lessons and quests, pick Today's next step, order Ask suggestions and visit questions, and leave out foods the person doesn't eat. Profile topics only reorder relevant evidence; they never answer an unrelated question. Nothing infers a condition, scores health, or judges food. A weekly reflection reports counts and averages only — no "good", "bad", "improving", or targets. The onboarding flow has one optional routine step that seeds the profile.

## 2026-09-25 — Mobile: nothing moves on focus

An attempt to hide the tab bar and re-pin composers while typing caused taps to land on the wrong element: the field blurs on pointer-down, the layout changes, and the pointer-up hits something else. The e2e journey caught it. The rule now: no layout change on focus or blur. The viewport uses `interactive-widget=resizes-content` and `viewport-fit=cover`, safe-area insets pad the top bar and page, all standalone tap targets are at least 44px, and a web app manifest plus icons let people add HealthQuest to their home screen. There is deliberately no service worker, so no health data is cached offline.
