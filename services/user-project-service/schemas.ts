import { z } from "zod";

// A user is assigned to a project with a specific role.
export const userProjectSchema = z.object({
  userId: z.number().int().positive(),
  projectId: z.number().int().positive(),
  roleId: z.number().int().positive(),
});
