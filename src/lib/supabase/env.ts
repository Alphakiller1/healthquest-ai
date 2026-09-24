export function assertPublicKeyIsNotServiceRole(
  anonKey: string,
  serviceRoleKey: string | undefined,
): void {
  if (serviceRoleKey && anonKey === serviceRoleKey) {
    throw new Error("The public Supabase key must not be the service role key.");
  }
}

export function getPublicSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  assertPublicKeyIsNotServiceRole(anonKey, process.env.SUPABASE_SERVICE_ROLE_KEY);
  return { url, anonKey };
}
