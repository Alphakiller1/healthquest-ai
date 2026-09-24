# Data model

Migration: `supabase/migrations/20260924120000_foundation.sql`.

User-owned tables use `user_id` and `auth.uid()` policies: profiles, preferences, consents, contexts, family history, food and activity logs, habits, conversations, messages, and lesson progress.

Reference tables (health contexts, lessons, quests, achievements, active evidence) are readable by signed-in users and not writable by them.

`gamification_events` is append-only from the server. Clients may read their own rows. `idempotency_key` is unique.

`safety_events` stores category, rule version, and action shown. No message text column.

`nutrition_cache` stores FoodData Central id, dataset, payload, and retrieval time. It is not readable by the browser role.

`save_ai_conversations` defaults to false.
