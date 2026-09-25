import type { Metadata } from "next";
import Link from "next/link";
import { HQGlyph, HQIcon } from "@/components/hq/icon";
import { HQButton, HQCallout, HQChoice, HQField, HQSection } from "@/components/hq/primitives";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { getDemoStore } from "@/lib/demo/store";
import { shouldRecommendGentleFoodMode } from "@/lib/health/contexts";
import { clearSavedConversations, deleteAccount, signOut, updatePreferences } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Settings · HealthQuest" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const gentleLocked = shouldRecommendGentleFoodMode(user.healthContextIds ?? []);
  const savedLines = (await getDemoStore()).listConversations(user.id).length;
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY);

  return (
    <main className="hq-main">
      <div className="hq-settings">
        <header className="hq-page-head">
          <Link href="/you" className="hq-section__action hq-cluster" style={{ gap: 4, padding: 0 }}>
            <HQIcon name="chevron-left" size={16} /> You
          </Link>
          <h1 className="hq-title">Settings</h1>
          <p className="hq-secondary">Signed in as {user.email}.</p>
        </header>

        {params.saved ? (
          <div role="status">
            <HQCallout tone="positive">Preferences saved.</HQCallout>
          </div>
        ) : null}

        <Link href="/you/profile" className="hq-today__nudge">
          <HQGlyph name="compass" tone="brand" />
          <span>
            <span className="hq-today__win-title">Goals, routine, and health topics</span>
            <span className="hq-micro" style={{ display: "block" }}>
              These live in your health profile now.
            </span>
          </span>
          <HQIcon name="chevron-right" size={18} className="hq-tint-muted" />
        </Link>

        <form action={updatePreferences} className="hq-stack" style={{ gap: 32 }}>
          <HQSection title="Privacy and AI" id="privacy">
            <HQChoice
              name="aiEnabled"
              icon="compass"
              label="Use AI to write explanations"
              hint={
                aiConfigured
                  ? "Off means answers come only from reviewed sources, and nothing is sent to an AI provider."
                  : "AI isn't connected on this site yet; answers come from reviewed sources either way."
              }
              defaultChecked={user.aiEnabled !== false}
            />
            <HQChoice
              name="saveAiConversations"
              icon="journal"
              label="Save questions and answers"
              hint="Off by default. When on, they're in your export and deleted with your account."
              defaultChecked={user.saveAiConversations === true}
            />
          </HQSection>

          <HQSection title="Reading and display" id="display">
            <HQChoice
              name="plainLanguage"
              icon="book"
              label="Plain language first"
              hint="Lessons lead with the takeaway"
              defaultChecked={user.plainLanguage === true}
            />
            <HQChoice
              name="gentleFoodMode"
              icon="leaf"
              label="Gentle Food Mode"
              hint={gentleLocked ? "Stays on for a topic you chose" : "No calorie or weight talk, no food scoring"}
              defaultChecked={user.gentleFoodMode || gentleLocked}
            />
            <HQChoice
              name="highContrast"
              icon="moonsun"
              label="Higher contrast"
              hint="Stronger text and borders on every screen"
              defaultChecked={user.highContrast === true}
            />
          </HQSection>

          <HQButton type="submit" variant="primary" icon="check">
            Save preferences
          </HQButton>
        </form>

        <HQSection title="How answers are handled" id="handling">
          <p className="hq-secondary" style={{ margin: 0 }}>
            {aiConfigured
              ? "When AI is on, your question and the topics you chose — never your name or email — go to OpenAI's Responses API with storage turned off. "
              : "No AI provider is connected, so answers are assembled from reviewed sources on HealthQuest's own server. "}
            Zero Data Retention is not enabled. Every answer is checked for safety and citations before you see it.
          </p>
          <div className="hq-cluster" style={{ justifyContent: "space-between" }}>
            <span className="hq-micro">
              {savedLines} saved {savedLines === 1 ? "line" : "lines"}
            </span>
            <form action={clearSavedConversations}>
              <HQButton type="submit" size="sm">
                Delete saved conversations
              </HQButton>
            </form>
          </div>
        </HQSection>

        <HQSection title="Your data" id="data">
          <p className="hq-secondary" style={{ margin: 0 }}>
            Download everything HealthQuest stores about you as a readable file, including your profile and logs.
          </p>
          <div className="hq-cluster" style={{ gap: 12 }}>
            <a className="hq-btn" href="/settings/export">
              <HQIcon name="arrow-up" />
              Export my data
            </a>
            <form action={signOut}>
              <HQButton type="submit" variant="quiet">
                Sign out
              </HQButton>
            </form>
          </div>
        </HQSection>

        <form action={deleteAccount} className="hq-danger">
          <h2 className="hq-section-title" style={{ margin: 0 }}>
            Delete my account and data
          </h2>
          <p className="hq-secondary" style={{ margin: 0 }}>
            Removes your profile, logs, lessons, points, and saved questions. This can&rsquo;t be undone. Type DELETE to confirm.
          </p>
          {params.error === "confirm" ? (
            <div role="alert">
              <HQCallout tone="caution">Type DELETE to confirm.</HQCallout>
            </div>
          ) : null}
          <HQField label="Confirmation" htmlFor="confirm">
            <input id="confirm" name="confirm" className="hq-input" autoComplete="off" autoCapitalize="characters" />
          </HQField>
          <HQButton type="submit" variant="emergency-outline" block>
            Delete my account and data
          </HQButton>
        </form>
      </div>
    </main>
  );
}
