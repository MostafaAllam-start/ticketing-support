import type { z } from "zod";
import type { Company } from "@/app/generated/prisma/client";
import type { createCompanySchema, updateCompanySchema } from "./schemas";

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export type { Company };
