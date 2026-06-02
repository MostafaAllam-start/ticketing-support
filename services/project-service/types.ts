import type { z } from "zod";
import type { Project } from "@/app/generated/prisma/client";
import type { createProjectSchema, updateProjectSchema } from "./schemas";

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export type { Project };
