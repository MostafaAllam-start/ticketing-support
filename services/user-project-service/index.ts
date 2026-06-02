import { Service } from "../service";
import { userProjectSchema } from "./schemas";
import type { UserProjectInput } from "./types";
import type { UserProject } from "@/app/generated/prisma/client";

export class UserProjectService extends Service {
  // Adds a user to a project with a role, or updates their role if they are
  // already a member (one membership per user + project).
  async assign(input: UserProjectInput): Promise<UserProject> {
    const data = userProjectSchema.parse(input);
    return this.prisma.userProject.upsert({
      where: {
        userId_projectId: { userId: data.userId, projectId: data.projectId },
      },
      create: data,
      update: { roleId: data.roleId },
    });
  }

  // Removes a user from a project.
  remove(userId: number, projectId: number): Promise<UserProject> {
    return this.prisma.userProject.delete({
      where: { userId_projectId: { userId, projectId } },
    });
  }

  // Members of a project, with each member's user summary and project role.
  forProject(projectId: number) {
    return this.prisma.userProject.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, username: true } },
        role: true,
      },
    });
  }

  // Projects a user belongs to, with the company and the user's project role.
  forUser(userId: number) {
    return this.prisma.userProject.findMany({
      where: { userId },
      include: {
        project: { include: { company: true } },
        role: true,
      },
    });
  }
}

export const userProjectService = new UserProjectService();

export * from "./schemas";
export * from "./types";
