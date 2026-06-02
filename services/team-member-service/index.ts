import { Service } from "../service";
import { createTeamMemberSchema, updateTeamMemberSchema } from "./schemas";
import type {
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
} from "./types";
import type { TeamMember } from "@/app/generated/prisma/client";

// Linked user summary, included for table display.
const teamMemberInclude = {
  user: { select: { id: true, name: true, username: true } },
} as const;

// The linked user's contact details (only surfaced for users who opted in via
// hasContactInfoCard) so each landing card can open a contact modal. The first
// company the user belongs to is included for the card's company section.
const teamMemberContactInclude = {
  user: {
    select: {
      id: true,
      email: true,
      jobTitle: true,
      website: true,
      whatsapp: true,
      linkedin: true,
      hasContactInfoCard: true,
      projectMemberships: {
        take: 1,
        select: {
          project: {
            select: {
              company: {
                select: { name: true, logo: true, websiteUrl: true },
              },
            },
          },
        },
      },
    },
  },
} as const;

export class TeamMemberService extends Service {
  // Every team member with their linked user (if any), for the admin table.
  list() {
    return this.prisma.teamMember.findMany({
      include: teamMemberInclude,
      orderBy: { id: "asc" },
    });
  }

  // Team members with their linked user's contact details (if the user opted in),
  // for the public "Our Team" section — each opted-in card opens a contact modal.
  listWithContacts() {
    return this.prisma.teamMember.findMany({
      include: teamMemberContactInclude,
      orderBy: { id: "asc" },
    });
  }

  findById(id: number) {
    return this.prisma.teamMember.findUnique({
      where: { id },
      include: teamMemberInclude,
    });
  }

  async create(input: CreateTeamMemberInput): Promise<TeamMember> {
    const data = createTeamMemberSchema.parse(input);
    if (data.userId !== undefined) {
      await this.assertUserLinkable(data.userId);
    }
    return this.prisma.teamMember.create({ data });
  }

  // Partial update. When `userId` is provided (and not null) the target user must
  // exist and not already be linked to a different team member.
  async update(id: number, input: UpdateTeamMemberInput): Promise<TeamMember> {
    const data = updateTeamMemberSchema.parse(input);
    await this.assertExists(id);
    if (data.userId !== undefined && data.userId !== null) {
      await this.assertUserLinkable(data.userId, id);
    }
    return this.prisma.teamMember.update({ where: { id }, data });
  }

  async delete(id: number): Promise<TeamMember> {
    await this.assertExists(id);
    return this.prisma.teamMember.delete({ where: { id } });
  }

  // --- helpers ---

  private async assertExists(id: number): Promise<void> {
    const member = await this.prisma.teamMember.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!member) {
      throw new Error(`Team member ${id} not found`);
    }
  }

  // The linked user must exist (and not be soft-deleted), and must not already be
  // linked to another team member — `user_id` is unique on team_members.
  private async assertUserLinkable(
    userId: number,
    excludeId?: number,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const linked = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        ...(excludeId !== undefined ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (linked) {
      throw new Error(`User ${userId} is already linked to a team member`);
    }
  }
}

export const teamMemberService = new TeamMemberService();

export * from "./schemas";
export * from "./types";
