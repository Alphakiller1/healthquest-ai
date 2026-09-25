import type { Metadata } from "next";
import { AskClient } from "@/components/screens/ask-client";
import { requireOnboardedUser } from "@/lib/demo/current-user";
import { suggestedQuestions } from "@/lib/profile/personalize";
import { askQuestion } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ask · HealthQuest" };

export default async function AskPage() {
  const user = await requireOnboardedUser();
  return (
    <main className="hq-main">
      <AskClient
        ask={askQuestion}
        aiConfigured={Boolean(process.env.OPENAI_API_KEY)}
        aiEnabled={user.aiEnabled !== false}
        savingConversations={user.saveAiConversations === true}
        prompts={suggestedQuestions(user)}
      />
    </main>
  );
}
