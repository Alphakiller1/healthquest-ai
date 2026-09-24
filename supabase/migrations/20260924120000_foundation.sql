-- HealthQuest Phase 0 schema. Assumes Supabase auth.users, anon, and authenticated roles.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  birth_date date not null,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  gentle_food_mode boolean not null default false,
  save_ai_conversations boolean not null default false,
  plain_language boolean not null default false,
  ai_enabled boolean not null default false
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  consent_type text not null check (
    consent_type in (
      'ai_processing',
      'health_data_processing',
      'privacy_policy',
      'terms'
    )
  ),
  policy_version text not null,
  accepted boolean not null,
  created_at timestamptz not null default now()
);

create table public.health_contexts (
  id text primary key,
  label text not null,
  mode text not null check (mode in ('contextual_education', 'education_only')),
  recommend_gentle_food_mode boolean not null default false
);

create table public.user_health_contexts (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  context_id text not null references public.health_contexts (id),
  primary key (user_id, context_id)
);

create table public.family_history_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  category text not null,
  created_at timestamptz not null default now()
);

create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  logged_on date not null,
  created_at timestamptz not null default now()
);

create table public.food_log_items (
  id uuid primary key default gen_random_uuid(),
  food_log_id uuid not null references public.food_logs (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  food_name text not null,
  quantity numeric,
  serving_unit text,
  preparation text,
  approximate_cost_cents integer,
  notes text,
  fdc_id text,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  activity_type text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  intensity text not null check (intensity in ('easy', 'moderate', 'hard')),
  logged_on date not null,
  created_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  logged_on date not null,
  sleep_hours numeric,
  water_cups integer,
  stress_rating integer check (stress_rating between 1 and 5),
  mood_rating integer check (mood_rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.gamification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  event_type text not null,
  source_entity_id text not null,
  points integer not null check (points >= 0),
  created_at timestamptz not null default now(),
  idempotency_key text not null unique
);

create table public.user_gamification_state (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  total_points integer not null default 0 check (total_points >= 0),
  level_name text not null default 'Bronze'
);

create table public.achievements (
  id text primary key,
  title text not null,
  description text not null
);

create table public.user_achievements (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  achievement_id text not null references public.achievements (id),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table public.quests (
  id text primary key,
  title text not null,
  description text not null
);

create table public.user_quests (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  quest_id text not null references public.quests (id),
  status text not null check (status in ('active', 'completed', 'skipped')),
  primary key (user_id, quest_id)
);

create table public.lessons (
  id text primary key,
  title text not null,
  estimated_minutes integer not null,
  body text not null
);

create table public.lesson_completions (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  lesson_id text not null references public.lessons (id),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.evidence_sources (
  id text primary key,
  organization text not null,
  title text not null,
  url text not null,
  publication_date date,
  last_reviewed_at date not null,
  jurisdiction text not null,
  status text not null check (status in ('active', 'pending_review', 'retired'))
);

create table public.evidence_claims (
  id text primary key,
  source_id text not null references public.evidence_sources (id),
  topic text not null,
  claim text not null,
  applicability text not null,
  version text not null,
  reviewed_at date not null
);

create table public.safety_rule_versions (
  version text primary key,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (user_id) on delete set null,
  category text not null,
  rule_version text not null,
  action_displayed text not null,
  created_at timestamptz not null default now()
);

create table public.nutrition_cache (
  fdc_id text primary key,
  description text not null,
  source_dataset text not null,
  payload jsonb not null,
  retrieved_at timestamptz not null
);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.consents enable row level security;
alter table public.health_contexts enable row level security;
alter table public.user_health_contexts enable row level security;
alter table public.family_history_entries enable row level security;
alter table public.food_logs enable row level security;
alter table public.food_log_items enable row level security;
alter table public.activity_logs enable row level security;
alter table public.habit_logs enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.gamification_events enable row level security;
alter table public.user_gamification_state enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.quests enable row level security;
alter table public.user_quests enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.evidence_sources enable row level security;
alter table public.evidence_claims enable row level security;
alter table public.safety_rule_versions enable row level security;
alter table public.safety_events enable row level security;
alter table public.nutrition_cache enable row level security;

alter table public.profiles force row level security;
alter table public.user_preferences force row level security;
alter table public.consents force row level security;
alter table public.user_health_contexts force row level security;
alter table public.family_history_entries force row level security;
alter table public.food_logs force row level security;
alter table public.food_log_items force row level security;
alter table public.activity_logs force row level security;
alter table public.habit_logs force row level security;
alter table public.ai_conversations force row level security;
alter table public.ai_messages force row level security;
alter table public.gamification_events force row level security;
alter table public.user_gamification_state force row level security;
alter table public.user_achievements force row level security;
alter table public.user_quests force row level security;
alter table public.lesson_completions force row level security;
alter table public.safety_events force row level security;
alter table public.nutrition_cache force row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant select, insert, update, delete on public.consents to authenticated;
grant select on public.health_contexts to authenticated;
grant select, insert, delete on public.user_health_contexts to authenticated;
grant select, insert, update, delete on public.family_history_entries to authenticated;
grant select, insert, update, delete on public.food_logs to authenticated;
grant select, insert, update, delete on public.food_log_items to authenticated;
grant select, insert, update, delete on public.activity_logs to authenticated;
grant select, insert, update, delete on public.habit_logs to authenticated;
grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert, update, delete on public.ai_messages to authenticated;
grant select on public.gamification_events to authenticated;
grant select on public.user_gamification_state to authenticated;
grant select on public.achievements to authenticated;
grant select on public.user_achievements to authenticated;
grant select on public.quests to authenticated;
grant select on public.user_quests to authenticated;
grant select on public.lessons to authenticated;
grant select on public.lesson_completions to authenticated;
grant select on public.evidence_sources to authenticated;
grant select on public.evidence_claims to authenticated;
grant select on public.safety_rule_versions to authenticated;

create policy profiles_own on public.profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy preferences_own on public.user_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy consents_own on public.consents
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy health_contexts_read on public.health_contexts
  for select to authenticated
  using (true);

create policy user_contexts_own on public.user_health_contexts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy family_history_own on public.family_history_entries
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy food_logs_own on public.food_logs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy food_items_own on public.food_log_items
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy activity_own on public.activity_logs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy habits_own on public.habit_logs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy conversations_own on public.ai_conversations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy messages_own on public.ai_messages
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy xp_read_own on public.gamification_events
  for select to authenticated
  using (user_id = auth.uid());

create policy xp_state_read_own on public.user_gamification_state
  for select to authenticated
  using (user_id = auth.uid());

create policy achievements_read on public.achievements
  for select to authenticated
  using (true);

create policy user_achievements_read on public.user_achievements
  for select to authenticated
  using (user_id = auth.uid());

create policy quests_read on public.quests
  for select to authenticated
  using (true);

create policy user_quests_read on public.user_quests
  for select to authenticated
  using (user_id = auth.uid());

create policy lessons_read on public.lessons
  for select to authenticated
  using (true);

create policy lesson_completions_read on public.lesson_completions
  for select to authenticated
  using (user_id = auth.uid());

create policy evidence_read on public.evidence_sources
  for select to authenticated
  using (status = 'active');

create policy claims_read on public.evidence_claims
  for select to authenticated
  using (
    exists (
      select 1 from public.evidence_sources s
      where s.id = source_id and s.status = 'active'
    )
  );

create policy safety_versions_read on public.safety_rule_versions
  for select to authenticated
  using (true);

-- safety_events and nutrition_cache have no authenticated policies.
-- The service role bypasses RLS. Clients cannot read or write them.
