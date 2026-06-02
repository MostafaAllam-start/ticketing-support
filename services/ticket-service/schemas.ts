import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  userId: z.number().int().positive(),
  // Optional initial set of software-engineer ids to assign on creation.
  assigneeIds: z.array(z.number().int().positive()).optional(),
});

// A reviewer assigns a ticket to zero or more software-engineers. The list is the
// full desired set of assignees — the service replaces any existing assignment.
export const assignTicketSchema = z.object({
  ticketId: z.number().int().positive(),
  assigneeIds: z.array(z.number().int().positive()).default([]),
});

export const ticketStatusValues = ["open", "in_progress", "closed"] as const;

// Partial update of a ticket's editable fields. Every field is optional so the
// caller decides which to expose (a reporter edits title/description; a
// reviewer/admin may also change status).
export const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(ticketStatusValues).optional(),
});
