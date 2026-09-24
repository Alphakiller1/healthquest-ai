export const XP_VALUES = {
  daily_check_in: 5,
  meal_logged: 5,
  activity_logged: 10,
  lesson_completed: 15,
  quiz_completed: 10,
  weekly_quest_completed: 40,
  budget_planning_completed: 10,
  seven_active_days: 25,
} as const;

export type XpEventType = keyof typeof XP_VALUES;

export type GamificationEvent = {
  id: string;
  userId: string;
  eventType: XpEventType;
  sourceEntityId: string;
  points: number;
  createdAt: string;
  idempotencyKey: string;
};

export function idempotencyKey(
  userId: string,
  eventType: XpEventType,
  sourceEntityId: string,
): string {
  return `${userId}:${eventType}:${sourceEntityId}`;
}

export function appendXpEvent(
  existing: readonly GamificationEvent[],
  draft: Omit<GamificationEvent, "points" | "idempotencyKey"> & {
    points?: number;
  },
): { events: GamificationEvent[]; awarded: boolean } {
  const key = idempotencyKey(draft.userId, draft.eventType, draft.sourceEntityId);
  if (existing.some((event) => event.idempotencyKey === key)) {
    return { events: [...existing], awarded: false };
  }
  const event: GamificationEvent = {
    ...draft,
    points: XP_VALUES[draft.eventType],
    idempotencyKey: key,
  };
  return { events: [...existing, event], awarded: true };
}

export function totalXp(events: readonly GamificationEvent[]): number {
  return events.reduce((sum, event) => sum + event.points, 0);
}
