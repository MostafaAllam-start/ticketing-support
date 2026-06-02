import { Service } from "../service";
import { createPartnerSchema, updatePartnerSchema } from "./schemas";
import type { CreatePartnerInput, UpdatePartnerInput } from "./types";
import type { Partner } from "@/app/generated/prisma/client";

export class PartnerService extends Service {
  list(): Promise<Partner[]> {
    return this.prisma.partner.findMany({ orderBy: { id: "asc" } });
  }

  findById(id: number): Promise<Partner | null> {
    return this.prisma.partner.findUnique({ where: { id } });
  }

  async create(input: CreatePartnerInput): Promise<Partner> {
    const data = createPartnerSchema.parse(input);
    return this.prisma.partner.create({ data });
  }

  // Partial update of a partner's fields.
  async update(id: number, input: UpdatePartnerInput): Promise<Partner> {
    const data = updatePartnerSchema.parse(input);
    await this.assertExists(id);
    return this.prisma.partner.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Partner> {
    await this.assertExists(id);
    return this.prisma.partner.delete({ where: { id } });
  }

  // --- helpers ---

  private async assertExists(id: number): Promise<void> {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!partner) {
      throw new Error(`Partner ${id} not found`);
    }
  }
}

export const partnerService = new PartnerService();

export * from "./schemas";
export * from "./types";
