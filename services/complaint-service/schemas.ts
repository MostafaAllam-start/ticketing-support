import { z } from "zod";

export const createComplaintSchema = z.object({
  title: z.string().min(1),
  details: z.string().min(1),
  ticketId: z.number().int().positive(),
  createdById: z.number().int().positive(),
});
