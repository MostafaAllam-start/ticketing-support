import type { z } from "zod";
import type { Complaint } from "@/app/generated/prisma/client";
import type { createComplaintSchema } from "./schemas";

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

export type { Complaint };
