"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { demoModeEnabled, writeSession } from "@/lib/demo/session";
import { getDemoStore } from "@/lib/demo/store";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email();

export async function signIn(formData: FormData) {
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

  if (!demoModeEnabled()) {
    redirect("/login?error=config");
  }

  const store = getDemoStore();
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
