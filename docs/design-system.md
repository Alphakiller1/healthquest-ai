# HealthQuest design system

HealthQuest should feel like a companion helping someone understand themselves, not software grading their health. Every decision below supports one feeling: *you don't need to transform your life today — just understand one more thing and take one more step.*

The live reference is **`/design-system`** (development only; set `HQ_DESIGN_SYSTEM=1` to serve it in production). Treat it as the visual regression page: if a component looks wrong there, it looks wrong everywhere.

## Where things live

| Layer | Location |
| --- | --- |
| Tokens (color, space, radius, elevation, layout) | `src/styles/tokens.css` |
| Type roles | `src/styles/typography.css` |
| Motion tokens, keyframes, reduced motion | `src/styles/motion.css` |
| Base elements, focus, layout helpers | `src/styles/utilities.css` |
| Component classes (`.hq-*`) | `src/styles/components.css` |
| Screen compositions | `src/styles/screens.css` |
| Components | `src/components/hq/` |
| Screens | `src/components/screens/` |
| Today view-model | `src/lib/today/today.ts` |

`globals.css` imports these and maps tokens into Tailwind's theme (`bg-canvas`, `text-ink-2`, `text-brand-ink`, …). Use Tailwind for layout only; anything visual belongs in a component. Never write a raw hex value outside `tokens.css`.

## Principles

1. **One dominant action per screen.** Everything else steps back.
2. **Progress is a path.** A missed day is a rest, never a break in the line.
3. **XP measures participation and learning, never health.** Levels say so wherever they appear.
4. **Red means real safety.** Ordinary wellness information is never styled as danger.
5. **Containment is earned.** Sections sit on the canvas unless a box helps.
6. **Copy sounds like a thoughtful coach.** Short, specific, never shaming.
7. **Plain language first.** Someone with low health literacy follows every screen.

Before calling a screen done, ask: would it still be HealthQuest without the logo? Is every card necessary? Is there one clear action? Does anything look like a default component library? Does the person feel supported, not judged?

## Color

Warm paper in light mode, botanical charcoal in dark. Never pure white canvas, never pure black.

- **Fern** (`--hq-brand`) — progress, the path, primary actions. Fern is a *fill and graphic* color. Text uses `--hq-brand-ink`, which clears AA on every surface.
- **Sun** (`--hq-sun`) — learning, sparks, XP, milestones. Text uses `--hq-sun-ink`.
- **Info / caution** — calm tones for information.
- **Emergency** — only the safety banner and destructive actions.
- **Tiers** (bronze → diamond) — participation marks only.

Every text/background pair was checked against WCAG AA in both themes (lowest: muted ink on tinted surfaces, 4.99:1).

Surfaces, from back to front: canvas → soft (low-priority context) → surface (standard) → raised (interactive or important) → accent (fern-soft, progress) / sun-soft (learning) → safety.

Dark mode is redefined, not inverted: a botanical charcoal canvas, warm off-white ink, softened accents, and deeper shadows. High contrast strengthens lines and ink. It comes from the OS (`prefers-contrast: more`) or the account setting in Settings, which sets `.hq-contrast` on `<html>`.

## Typography

- **Hanken Grotesk** — every interface word and number. Warm humanist grotesk, good lowercase, tabular numerals.
- **Newsreader** — moments of voice: the greeting, lesson reading, the assistant's plain answer, onboarding questions. Used sparingly, never for UI chrome.

| Role | Class | Use |
| --- | --- | --- |
| Display | `.hq-display` | Greeting, onboarding question. Once per screen. |
| Title | `.hq-title` | Page titles. |
| Section | `.hq-section-title` | Compact group headings. |
| Reading | `.hq-reading` | Lesson body, takeaways. |
| Body / secondary | `.hq-body`, `.hq-secondary` | Default text; supporting text. |
| Label | `.hq-label` | Structural labels, sentence case (not all caps). |
| Numeric | `.hq-numeric`, `.hq-numeric-lg` | XP, counts, durations. |

Let weight carry the hierarchy (400 / 500 / 600). Bold is only for the wordmark.

## Spacing and shape

A 4px base (`--hq-space-1` … `--hq-space-16`). Screen sections sit 24px apart on mobile and 32–40px apart on desktop. Cards pad 20px.

Radii stay restrained: 10px for controls, 16px for containers, pills only for chips. Elevation uses tone and borders first. `shadow-medium` is reserved for the one dominant card per screen (the active quest).

Touch targets are 44px minimum, and 48px for primary buttons.

## Symbols

A custom set in `icon.tsx`: one 24px grid, a 1.75 stroke, round joins. Always render through `<HQIcon>` or `<HQGlyph>` (a symbol in a tinted tile), never raw SVG and never emoji.

| Symbol | Means |
| --- | --- |
| **path** | Progress, quests, the brand mark |
| **spark** | Insight, XP, small wins |
| **marker** | A quest objective |
| **compass** | Guidance — the assistant |
| **book** | Lessons, sources |
| **sun / today** | Daily check-in, the Today tab |
| **moon** | Sleep, rest |
| **drop** | Hydration |
| **motion** | Movement |
| **bowl** | Meals |
| **leaf** | Wellness, gentle food mode — sparingly |
| **heart** | Cardiovascular topics only — sparingly |
| **shield** | Privacy, safety, consent |

Icons are decorative (`aria-hidden`) unless given a `label`, and are only labelled when no nearby text already says the same thing.

## The signature: the Path

`<HQPath>` draws progress as waypoints:

- ● **done**: a filled fern node with a check
- ◉ **current**: a ring with a centre dot and a soft halo
- ○ **ahead**: a hollow ring
- · **rest**: a small quiet dot, used for a past day with no activity

Walked links are solid, and each one bows in a slight arc (the soft-arc motif). The road ahead is dotted. Every node has a distinct shape and a spoken state, so meaning never depends on color alone.

It appears in the Today week, quest progress, onboarding progress, levels, lesson sections (vertical), the quests overview (vertical), the assistant's "Try this" steps, empty states, and the loader. That repetition is what makes HealthQuest recognisable without the logo. The active tab even sits under a small node.

## Reinforcement

| Level | When | Treatment |
| --- | --- | --- |
| 1 · Micro | Logging, check-in | `<HQToast>`: a short line, optional `+5 XP`, gone in about 3s, `aria-live="polite"` |
| 2 · Meaningful | Lesson done, quest step | A path node arrives (`arrived`), a spark reveal, the button confirms |
| 3 · Milestone | Quest complete, level, lasting mark | `<HQMilestone>`: a badge settles in with eight sparks. Rare by design. |

Never: confetti rain, streak-loss animations, or "You broke your streak."

## Voice

Good: *Nice. You showed up today.* · *Small steps count.* · *Welcome back. Your quest continues.* · *Not this week* (never "Skip") · *Set aside. No penalty.*

Avoid: exclamation stacks, "crushing it", "perfect meal", "cheat meal", "you failed".

Empty states invite: *Your movement journey starts whenever you're ready.* Streak copy comes from `lib/gamification/streaks.ts` and is already forgiving.

## Components

| Component | Purpose |
| --- | --- |
| `HQButton`, `HQButtonLink` | primary · secondary · quiet · emergency. One primary per view. |
| `HQSurface`, `HQSection` | Containers by surface level; heading-plus-content without a box. |
| `HQPath`, `stepsToNodes` | The signature progress element. |
| `HQXp`, `HQChip` | XP (`reward` renders `+40 XP` in sun ink); small status chips. |
| `HQQuestCard` | Objective, path, effort, reward, "Why this matters", actions. `emphasis="primary"` for the one featured quest. |
| `HQLessonFeature`, `HQLessonRow` | Today's single lesson; list rows with done nodes. |
| `HQAchievementBadge` | Softened octagon medal; `locked` shows a dotted outline and a hint. |
| `HQAssistantResponse` | Structured answer built from `AssistantResponse`. |
| `HQCallout`, `HQSafetyBanner` | Calm information; the only loud red. |
| `HQEmptyState`, `HQLoader`, `HQSkeleton` | Invitations, the waypoint loader, shimmer skeletons. |
| `HQField`, `HQChoice` | Labelled inputs; whole-row checkbox and radio targets. |
| `HQToast`, `HQMilestone`, `HQConfirmButton` | The reinforcement levels. |
| `HQAppShell`, `HQTabBar`, `HQSidebar`, `HQTopBar` | Navigation frame. |
| `HQPreferenceControls` | Theme and motion, stored on the device. |

## Navigation

Five destinations: **Today · Journal · Quests · Learn · You**. The assistant is not a tab. It's always one tap away: the compass in the mobile top bar, a button in the desktop sidebar, and the Ask field on Today. Health factors, visit questions and settings live under You.

Phones get bottom tabs and a sticky top bar with XP. From 1024px, a 240px sidebar replaces both. Signed-out pages and onboarding get only a quiet header.

## Screens

- **Today** (`/today`, `/dashboard` redirects here): greeting → the week as a path (plus check-in) → one quest → quick log → one lesson → Ask → the latest mark. From a 56rem container width it becomes two columns: journey and quest on the left, a rail on the right. It uses container queries, so the phone preview in `/design-system` stays in mobile layout.
- **Quests** (`/quests`): one featured quest, the others quieter, finished and set-aside quests last. An aside draws the whole week as a vertical path.
- **Ask** (`/ask`): a skeleton for now. It shows a clearly labelled example answer, and the composer's send button stays disabled until the live pipeline is connected.
- **Onboarding** (`/onboarding`): one question per screen, a "Why we ask" behind each, the path as progress, and focus moving to each new question. It posts the same fields to the existing `submitOnboarding` action.
- **You** (`/you`): the level trail, marks (earned and ahead), explore links, and appearance settings.

## Motion

| Token | Duration | Use |
| --- | --- | --- |
| `--hq-motion-fast` | 120ms | Press, hover |
| `--hq-motion-normal` | 220ms | State changes |
| `--hq-motion-slow` | 420ms | Rise-in, toasts |
| `--hq-motion-reveal` | 640ms | Node arrival, spark and badge reveal |

Easing is `--hq-ease-out` for most things and `--hq-ease-spring` (a small overshoot) for confirmations. Nothing floats, loops or parallaxes; the waypoint loader and the skeleton shimmer are the only repeats. `prefers-reduced-motion` or the in-app "Reduce motion" setting collapses every animation to about 1ms.

## Accessibility baseline

- WCAG AA contrast for all text, in both themes and in high contrast.
- A visible 2px focus ring on every interactive element, plus a skip link.
- 44px minimum targets; whole-row choices.
- Semantic landmarks, one `h1` per page, `aria-current` on the active tab and the current path node.
- Toasts announce politely; safety banners announce assertively.
- All type in rem; layouts reflow at 200% zoom and at 375px without horizontal scroll.

## Not yet done

- Journal, Move, Habits, Learn and the lesson reader, Settings, Health factors and Visit still use their original markup inside the new shell. Rebuild them with these components next, in that order.
- `lib/gamification/quests.ts` reports progress as text. `questSteps()` reads "n of m" from it; exposing `{ done, total }` directly would remove that parse.
- The Today check-in fires the Level 2 node arrival. Journal, Move and lesson completion should redirect with a notice the same way.
