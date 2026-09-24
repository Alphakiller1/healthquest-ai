# Privacy and security

This is engineering planning, not legal advice, and not a HIPAA claim.

Health data is minimized, used for the feature the person consented to, and not sold or used for ad profiles. Analytics events must be on the allowlist in `src/lib/privacy/analytics.ts`. Free-text prompts are not analytics.

Required consents before AI or health features: AI processing, health-data processing, privacy policy, and terms. Each row stores type, policy version, and time. AI can be turned off later.

Age under 18 stops onboarding before further health questions.

OpenAI API data is not used to train models unless the organization opts in (OpenAI data controls, reviewed 2026-09-24). Abuse-monitoring logs may keep content up to 30 days. Zero Data Retention is not approved and is not active. Call the Responses or Chat Completions API with `store: false`. Do not use Assistants or Threads.

Settings can export the local account as JSON and delete it. Deletion removes meals, movement, habits, lessons, points, and the count of education explanations. Sentry stays off until a scrubber exists; operational logs must not include meal text or prompts.

The service role key is read only from `SUPABASE_SERVICE_ROLE_KEY` and is rejected if it is copied into the public anon key. Browser client code does not reference it.

Security headers: `nosniff`, `DENY` framing, a strict referrer policy, and disabled camera, microphone, and geolocation.
