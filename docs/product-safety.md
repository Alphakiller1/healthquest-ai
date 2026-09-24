# Product safety

Rule version: `2026.09.24.1`.

Emergency categories: cardiac, stroke, severe breathing trouble, anaphylaxis, major bleeding, loss of consciousness, overdose, and suicide or self-harm crisis.

Medical emergencies tell the person to call 911. Self-harm uses a separate message with Call 988, Text 988, and Call 911. Both texts are constants in `src/lib/safety/responses.ts`.

The word “stroke” or “chest pain” alone does not trigger. Negated phrases are removed before matching. A movie or show retelling does not trigger unless the speaker also describes their own distress.

Safety logs, when added, store category, rule version, action shown, and an internal user id. They do not store the raw message.

Education-only contexts (pregnancy, dialysis, significant kidney disease, active cancer treatment, eating-disorder history, type 1 diabetes) may explain general concepts and must not receive personalized disease-management coaching. Disclosing an eating-disorder history recommends Gentle Food Mode.

Gentle Food Mode, when enabled later, hides calorie feedback, weight-loss messaging, food streaks, meal scores, and restrictive challenges.

No symptom points. No weight-loss points. No invented risk percentage.
