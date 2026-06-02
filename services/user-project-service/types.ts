import type { z } from "zod";
import type { UserProject } from "@/app/generated/prisma/client";
import type { userProjectSchema } from "./schemas";

export type UserProjectInput = z.infer<typeof userProjectSchema>;

export type { UserProject };
