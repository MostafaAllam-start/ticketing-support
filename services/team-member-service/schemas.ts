import { z } from "zod";

export const createTeamMemberSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  image: z.string().min(1),
  userId: z.number().int().positive().optional(), // optional link to a user
});

// Every field optional for partial updates. `userId` is nullable so the link to
// a user can be cleared.
export const updateTeamMemberSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  image: z.string().min(1).optional(),
  userId: z.number().int().positive().nullable().optional(),
});
