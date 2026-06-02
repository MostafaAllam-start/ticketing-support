import type { z } from "zod";
import type { Partner } from "@/app/generated/prisma/client";
import type { createPartnerSchema, updatePartnerSchema } from "./schemas";

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;

export type { Partner };
