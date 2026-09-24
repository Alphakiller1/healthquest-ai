# Threat model

| Threat | Current control | Gap |
| --- | --- | --- |
| Account takeover | Supabase Auth, cookie session, `getClaims()` | Magic-link UI not built |
| IDOR | RLS forced on user tables; PGlite tests | Not yet run on hosted Supabase |
| Service-role leak | Server env only; public key mismatch throws | Hosting dashboard still needs the secret kept private |
| Health data in logs | Analytics allowlist; emergency text not stored | Sentry is unset until scrubbing exists |
| Prompt injection | Structured output, citation allowlist, fail closed | Live model not connected |
| Citation fabrication | Unknown source id fails validation | Pending CDC URLs stay unusable |
| XSS | React text rendering; no model HTML | Keep it that way |
| CSRF | Cookie auth will use SameSite defaults from Supabase SSR | Re-check when mutations exist |
| Rate abuse | Config key `AI_DAILY_LIMIT_FREE` reserved | Limiter not enforced yet |
| RLS bypass | No client insert policy on XP or safety events | Service-role routes must stay server-only |
| Dependency risk | CI install and tests; Next.js pinned to 16.3.6 after a critical 16.3.2 advisory | Re-run `npm audit` when adding packages |
