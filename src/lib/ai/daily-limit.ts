export const ASSISTANT_LIMIT_MESSAGE =
  "You have reached today's education explanations. The meal is saved. You can keep logging meals; explanations resume tomorrow.";

export function assistantDailyLimit(raw = process.env.AI_DAILY_LIMIT_FREE): number {
  const parsed = Number(raw ?? "30");
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 200) return 30;
  return parsed;
}
