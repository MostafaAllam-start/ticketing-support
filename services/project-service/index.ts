import { Service } from "../service";
import { createProjectSchema, updateProjectSchema } from "./schemas";
import type { CreateProjectInput, UpdateProjectInput } from "./types";
import type { Project } from "@/app/generated/prisma/client";

// Company + manager summaries included for listings.
const projectInclude = {
  company: { select: { id: true, name: true, logo: true } },
  manager: { select: { id: true, name: true, username: true } },
} as const;

export class ProjectService extends Service {
  list() {
    return this.prisma.project.findMany({
      include: projectInclude,
      orderBy: { id: "asc" },
    });
  }

  // Ids of the projects the given user manages. Used to scope a manager's view of
  // tickets/complaints.
  async managedBy(userId: number): Promise<number[]> {
    const rows = await this.prisma.project.findMany({
      where: { managerId: userId },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  // Projects with company, manager, and full member list (each member's user +
  // project role). For the admin projects-management page.
  listDetailed() {
    return this.prisma.project.findMany({
      include: {
        company: { select: { id: true, name: true, logo: true } },
        manager: { select: { id: true, name: true, username: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, username: true } },
            role: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { id: "asc" },
    });
  }

  // A single project with company, manager, full member list, and its (non-deleted)
  // tickets. Backs the admin project details page.
  getDetail(id: number) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, logo: true } },
        manager: { select: { id: true, name: true, username: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, username: true } },
            role: { select: { id: true, name: true } },
          },
        },
        tickets: {
          where: { deletedAt: null },
          select: { id: true, title: true, status: true, createdAt: true },
          orderBy: { id: "desc" },
        },
      },
    });
  }

  // Projects belonging to one company.
  byCompany(companyId: number) {
    return this.prisma.project.findMany({
      where: { companyId },
      include: projectInclude,
      orderBy: { id: "asc" },
    });
  }

  findById(id: number): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { id } });
  }

  // The user id of the project's manager, if one is assigned.
  async managerUserId(projectId: number): Promise<number | null> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { managerId: true },
    });
    return project?.managerId ?? null;
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const data = createProjectSchema.parse(input);
    await this.assertCompanyExists(data.companyId);
    return this.prisma.project.create({ data });
  }

  // Partial update of a project's fields.
  async update(id: number, input: UpdateProjectInput): Promise<Project> {
    const data = updateProjectSchema.parse(input);
    await this.assertExists(id);
    if (data.companyId !== undefined) {
      await this.assertCompanyExists(data.companyId);
    }
    return this.prisma.project.update({ where: { id }, data });
  }

  // Deletes a project. Its memberships cascade away.
  async delete(id: number): Promise<Project> {
    await this.assertExists(id);
    return this.prisma.project.delete({ where: { id } });
  }

  // --- helpers ---

  private async assertExists(id: number): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!project) {
      throw new Error(`Project ${id} not found`);
    }
  }

  private async assertCompanyExists(companyId: number): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) {
      throw new Error(`Company ${companyId} not found`);
    }
  }
}

export const projectService = new ProjectService();

export * from "./schemas";
export * from "./types";
