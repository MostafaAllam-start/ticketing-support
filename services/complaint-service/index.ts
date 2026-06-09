import { Service } from "../service";
import { createComplaintSchema } from "./schemas";
import type { CreateComplaintInput } from "./types";
import type { Complaint } from "@/app/generated/prisma/client";

// Author + the ticket (with its project) summarized for listings.
const complaintInclude = {
  createdBy: { select: { id: true, name: true, username: true } },
  ticket: {
    select: {
      id: true,
      title: true,
      projectId: true,
      project: { select: { id: true, name: true } },
    },
  },
} as const;

export class ComplaintService extends Service {
  // Every complaint, newest first (admin view).
  list() {
    return this.prisma.complaint.findMany({
      include: complaintInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  // Complaints whose ticket belongs to one of the given projects (manager view,
  // scoped to the project[s] they manage). Returns nothing for an empty list.
  forProjects(projectIds: number[]) {
    if (projectIds.length === 0) return Promise.resolve([]);
    return this.prisma.complaint.findMany({
      where: { ticket: { projectId: { in: projectIds } } },
      include: complaintInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  getDetail(id: number) {
    return this.prisma.complaint.findUnique({
      where: { id },
      include: complaintInclude,
    });
  }

  async create(input: CreateComplaintInput): Promise<Complaint> {
    const data = createComplaintSchema.parse(input);
    return this.prisma.complaint.create({ data });
  }
}

export const complaintService = new ComplaintService();

export * from "./schemas";
export * from "./types";
