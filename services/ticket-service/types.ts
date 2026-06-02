import type { z } from "zod";
import type { Ticket, TicketStatus } from "@/app/generated/prisma/client";
import type {
  assignTicketSchema,
  createTicketSchema,
  updateTicketSchema,
} from "./schemas";

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

// KPI shape, computed from ticket status counts (there is no KPI table).
export type TicketStats = {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
};

// One day on the "tickets created over time" chart: how many tickets were created
// that day, split by their current status. `date` is an ISO calendar day
// (YYYY-MM-DD, UTC). Days with no tickets are still present (zero-filled) so the
// x-axis is continuous.
export type TicketTrendPoint = {
  date: string;
  open: number;
  in_progress: number;
  closed: number;
};

// Scope for role-based KPI/listing queries:
// - "all": admin (every ticket)
// - "assigned": engineer (tickets assigned to them)
// - "reported": tickets reported by a given user
export type TicketScope =
  | { kind: "all" }
  | { kind: "assigned"; userId: number }
  | { kind: "reported"; userId: number };

export type { Ticket, TicketStatus };
