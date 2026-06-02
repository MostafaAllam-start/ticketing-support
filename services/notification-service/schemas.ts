import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.number().int().positive(),
  // Application-level event kind, e.g. "ticket_assigned" or "reply_added".
  type: z.string().min(1),
  title: z.string().min(1),
  details: z.string().min(1),
  // Optional id of the related record (e.g. a ticket id), resolved in app code.
  entityId: z.number().int().positive().nullable().optional(),
});
