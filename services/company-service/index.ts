import { Service } from "../service";
import { createCompanySchema, updateCompanySchema } from "./schemas";
import type { CreateCompanyInput, UpdateCompanyInput } from "./types";
import type { Company } from "@/app/generated/prisma/client";

export class CompanyService extends Service {
  list(): Promise<Company[]> {
    return this.prisma.company.findMany({ orderBy: { id: "asc" } });
  }

  findById(id: number): Promise<Company | null> {
    return this.prisma.company.findUnique({ where: { id } });
  }

  async create(input: CreateCompanyInput): Promise<Company> {
    const data = createCompanySchema.parse(input);
    return this.prisma.company.create({ data });
  }

  // Partial update of a company's fields.
  async update(id: number, input: UpdateCompanyInput): Promise<Company> {
    const data = updateCompanySchema.parse(input);
    await this.assertExists(id);
    return this.prisma.company.update({ where: { id }, data });
  }

  // Deletes a company. Its projects (and their memberships) cascade away.
  async delete(id: number): Promise<Company> {
    await this.assertExists(id);
    return this.prisma.company.delete({ where: { id } });
  }

  // --- helpers ---

  private async assertExists(id: number): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!company) {
      throw new Error(`Company ${id} not found`);
    }
  }
}

export const companyService = new CompanyService();

export * from "./schemas";
export * from "./types";
