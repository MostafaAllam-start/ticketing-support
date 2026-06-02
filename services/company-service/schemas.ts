import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1),
  logo: z.string().min(1),
  websiteUrl: z.string().min(1),
});

// Every field optional for partial updates.
export const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  logo: z.string().min(1).optional(),
  websiteUrl: z.string().min(1).optional(),
});
