import { z } from "zod";

// The record kinds a notification can point at (mirrors the Prisma
// NotificationEntityType enum). Used to deep-link to the right detail page.
export const notificationEntityTypeValues = [
  "ticket",
  "suggestion",
  "complaint",
] as const;

export const createNotificationSchema = z.object({
  userId: z.number().int().positive(),
  // Application-level event kind, e.g. "ticket_assigned" or "reply_added".
  type: z.string().min(1),
  title: z.string().min(1),
  details: z.string().min(1),
  // Optional target the notification links to (e.g. a ticket or suggestion).
  // entityType + entityId are resolved together in app code; both or neither.
  entityType: z.enum(notificationEntityTypeValues).nullable().optional(),
  entityId: z.number().int().positive().nullable().optional(),
});
