import type { z } from "zod";
import type { TeamMember } from "@/app/generated/prisma/client";
import type {
  createTeamMemberSchema,
  updateTeamMemberSchema,
} from "./schemas";

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;

export type { TeamMember };
