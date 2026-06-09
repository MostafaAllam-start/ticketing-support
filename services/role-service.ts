import { z } from "zod";
import { Service } from "./service";
import type { Role } from "@/app/generated/prisma/client";

export const roleNameSchema = z.string().min(1, "Role name is required");

export class RoleService extends Service {
  // Creates a role. Names are unique, so a clear error is raised on conflict.
  async create(name: string): Promise<Role> {
    const parsed = roleNameSchema.parse(name);
    const existing = await this.prisma.role.findUnique({
      where: { name: parsed },
    });
    if (existing) {
      throw new Error(`Role "${parsed}" already exists`);
    }
    return this.prisma.role.create({ data: { name: parsed } });
  }

  list(): Promise<Role[]> {
    return this.prisma.role.findMany({ orderBy: { name: "asc" } });
  }

  findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { name } });
  }

  findById(id: number): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { id } });
  }

  async rename(id: number, name: string): Promise<Role> {
    const parsed = roleNameSchema.parse(name);
    return this.prisma.role.update({ where: { id }, data: { name: parsed } });
  }

  // Deletes a role, but only if no project memberships still reference it (roles
  // are granted per-project via the UserProject join).
  async delete(id: number): Promise<Role> {
    const assigned = await this.prisma.userProject.count({
      where: { roleId: id },
    });
    if (assigned > 0) {
      throw new Error(
        `Cannot delete role: ${assigned} project membership(s) still assigned`,
      );
    }
    return this.prisma.role.delete({ where: { id } });
  }
}

export const roleService = new RoleService();
