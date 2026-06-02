import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  companyId: z.number().int().positive(),
});

// Every field optional for partial updates.
export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  companyId: z.number().int().positive().optional(),
});
