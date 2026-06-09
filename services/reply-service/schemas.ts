import { z } from "zod";

export const replyEntityTypeValues = [
  "ticket",
  "complaint",
  "suggestion",
  "ticket_report",
] as const;

export const createReplySchema = z.object({
  entityType: z.enum(replyEntityTypeValues),
  entityId: z.number().int().positive(),
  // The author of the reply (taken from the session, never the form).
  userId: z.number().int().positive(),
  description: z.string().min(1),
  // Optional parent for threaded replies.
  parentReplyId: z.number().int().positive().optional(),
});
