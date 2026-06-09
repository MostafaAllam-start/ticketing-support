import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  userId: z.number().int().positive(),
  // The company the ticket belongs to. Set from the reporter's company (ECM or
  // CTC) when a user files a ticket; unset for staff-created tickets.
  companyId: z.number().int().positive().optional(),
  // Optional project scope. CTC tickets pick one of the company's projects;
  // ECM tickets leave this unset.
  projectId: z.number().int().positive().optional(),
  // Optional initial set of engineer/consultant ids to assign on creation.
  assigneeIds: z.array(z.number().int().positive()).optional(),
});

// Assign a ticket to zero or more engineers or consultants. The list is the full
// desired set of assignees — the service replaces any existing assignment.
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

// A diagnostic report (issue + solution) added to a ticket by the assigned
// engineer or a consultant. The author (userId) is taken from the session.
export const createReportSchema = z.object({
  ticketId: z.number().int().positive(),
  userId: z.number().int().positive(),
  issue: z.string().min(1),
  solution: z.string().min(1),
});
