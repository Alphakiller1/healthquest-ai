# Experience architecture

HealthQuest serves people with very different reading levels, eyesight, confidence with phones, time, and health situations. The structure below is how one app stays simple for someone on day one and useful for someone who wants every number — without two separate products.

## 1. Every screen follows one contract

1. **Where you are** — a short eyebrow ("Journal", "Now").
2. **The question this screen answers** — the title is a question in the person's words: "What did you have?", "What do you need right now?".
3. **One sentence of purpose** — why the screen exists.
4. **"What is this?"** — a collapsed note for anyone seeing the screen for the first time.
5. **One primary action** — full width on phones, always labelled with a verb ("Log a meal", "Add a sleep note").

`HQScreenHeader` renders 1–4. `tests/unit/experience.test.ts` fails if any page renders without a top-level heading.

## 2. Three depths, not three apps

Every screen is built in layers. A closed layer is always one labelled tap away — nothing is ever removed at a lower level.

| Depth | Name | What it holds | Examples |
| --- | --- | --- | --- |
| 1 | Glance | The key point and one action | Today's next step, the plain answer, a lesson's takeaway, "Lentils has less sodium than canned soup" |
| 2 | Guide | A short structured explanation and a few options | "Why it matters and what to try", the full lesson text, more movement options, your week in words |
| 3 | Deep dive | Numbers, sources, history, related reading | Sources, the full nutrient table, the 7-day log, today's tip, quests and level |

`HQLayer` renders depths 2 and 3 on native `<details>`: keyboard- and screen-reader-accessible, works without JavaScript, and each summary says what opening it gives you.

## 3. Detail grows with the person

`lib/experience/depth.ts` decides which layers start open:

| Level | Depth 2 | Depth 3 | Reached automatically when |
| --- | --- | --- | --- |
| Simple | closed | closed | new |
| Standard | open | closed | 3+ active days, or a lesson finished, or 8+ actions |
| Detailed | open | open | 10+ active days, 5+ lessons, or 5+ days with 5+ questions |

The level only grows with use, and the thresholds are low so nobody is stuck at Simple. While it is automatic, Today says what is happening ("HealthQuest is keeping things simple for now…") with a link to change it. The person can pick a level in Settings → How much detail?; their choice always wins.

## 4. Universal design layer

- **Text size** — the "Aa" button in every header (including sign-in and onboarding) cycles Standard → Large (112.5%) → Larger (125%). All type, spacing, and targets are in rem, so everything scales together. Stored per device.
- **Plain language first** — short sentences, everyday words, takeaway before explanation; the assistant writes at about a 6th–8th grade level.
- **Words with every icon** — no icon-only controls except the labelled "Aa" button.
- **Targets of 44px or more**, and nothing moves under a finger on focus or blur.
- **Nothing essential behind a gesture** — no swipes, long-presses, or hover-only content.
- **Contrast** — WCAG AA everywhere, plus a higher-contrast setting; dark mode; reduced motion.
- **Low bandwidth** — no images or video in the product; SVG icons; server-rendered pages.
- **Adults of any age** — the youngest a user can be is 18; there is no upper design age.

## 5. Adding a screen

1. Start with the contract (section 1) and decide the one action.
2. Put the minimum that answers the title at depth 1.
3. Put explanation at depth 2 and evidence or data at depth 3 with `HQLayer`, passing the person's level from `experienceFor(user)`.
4. Anything factual comes from an evidence claim; anything celebratory comes from `lib/moments/encouragement.ts`.
5. Check it at 375px with Larger text before shipping.
