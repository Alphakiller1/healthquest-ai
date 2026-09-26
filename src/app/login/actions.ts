"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withinLimit } from "@/lib/security/rate-limit";
import { demoModeEnabled, testerCodeMatches, testerModeEnabled, writeSession } from "@/lib/demo/session";
import { getDemoStore, preloadUserByEmail, withPersist } from "@/lib/demo/store";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// Lower-cased so "Ada@…" and "ada@…" are one account.
const emailSchema = z.string().trim().toLowerCase().email();

async function signInAction(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    redirect("/login?error=email");
  }

  if (getPublicSupabaseEnv()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.data,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback` },
    });
    redirect(error ? "/login?error=send" : "/login?sent=1");
  }

  if (testerModeEnabled()) {
    // Every attempt counts, per network (hashed), across server instances. Over the limit
    // the code isn't even checked, so guessing can't continue in the background.
    if (!(await withinLimit("tester-code", 10, 15 * 60))) redirect("/login?error=wait");
    if (!testerCodeMatches(String(formData.get("accessCode") ?? ""))) {
      await new Promise((done) => setTimeout(done, 750));
      redirect("/login?error=code");
    }
  } else if (!demoModeEnabled()) {
    redirect("/login?error=config");
  }

  await preloadUserByEmail(email.data);
  const store = await getDemoStore();
  const existing = store.getUserByEmail(email.data);
  const user = existing ?? {
    id: randomUUID(),
    email: email.data,
    birthDate: null,
    goals: [],
    consents: [],
    gentleFoodMode: false,
    onboardingComplete: false,
    blockedUnder18: false,
  };
  if (!existing) store.saveUser(user);
  await writeSession({ userId: user.id, email: user.email, demo: true });
  redirect(user.onboardingComplete ? "/dashboard" : "/onboarding");
}

export const signIn = withPersist(signInAction);
