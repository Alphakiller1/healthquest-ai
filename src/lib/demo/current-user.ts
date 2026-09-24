import { redirect } from "next/navigation";
import { readSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";

export async function requireOnboardedUser() {
  const session = await readSession();
  if (!session) redirect("/login");
  const user = getDemoStore().getUser(session.userId);
  if (!user) redirect("/login");
  if (!user.onboardingComplete) redirect("/onboarding");
  return user;
}
