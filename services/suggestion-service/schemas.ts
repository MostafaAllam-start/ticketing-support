import { z } from "zod";

export const createSuggestionSchema = z.object({
  title: z.string().min(1),
  // Optional free-text body.
  details: z.string().min(1).optional(),
  createdById: z.number().int().positive(),
  // The company the suggestion is about (required).
  companyId: z.number().int().positive(),
  // The project the suggestion is about (optional: a suggestion may be general to
  // the company, or scoped to one of its projects).
  projectId: z.number().int().positive().optional(),
});
