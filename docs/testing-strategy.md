# Testing strategy

Safety tests outrank visual polish.

Unit tests cover emergency hits, educational and negated misses, provider skip on emergency, crisis versus 911 copy, citation failure, education-only status, payload minimization, analytics allowlist, age gate, XP idempotency, and the browser client’s lack of a service-role reference.

RLS tests apply the migration on PGlite: user A cannot read user B’s food log, cannot rename user B, anonymous access fails, and safety events are invisible to the signed-in user.

Playwright journeys start when sign-up, logging, and the assistant exist. CI runs lint, typecheck, and Vitest.
