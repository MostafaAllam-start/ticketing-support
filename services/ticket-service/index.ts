import { Service } from "../service";
import {
  assignTicketSchema,
  createTicketSchema,
  updateTicketSchema,
} from "./schemas";
import type {
  AssignTicketInput,
  CreateTicketInput,
  TicketScope,
  TicketStats,
  TicketTrendPoint,
  UpdateTicketInput,
} from "./types";
import type { Ticket } from "@/app/generated/prisma/client";

const ENGINEER_ROLE = "software-engineer";

// Reporter summary + the assigned engineers (through the join table), for table
// display. Each assignment row carries the engineer's user summary.
const assigneesInclude = {
  include: {
    assignee: { select: { id: true, name: true, username: true } },
  },
} as const;

const ticketInclude = {
  user: { select: { id: true, name: true, username: true } },
  assignees: assigneesInclude,
} as const;

export class TicketService extends Service {
  // Admin: every (non-deleted) ticket.
  listAll() {
    return this.prisma.ticket.findMany({
      where: { deletedAt: null },
      include: ticketInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  // Engineer dashboard: tickets this engineer is one of the assignees of.
  assignedTo(assigneeId: number) {
    return this.prisma.ticket.findMany({
      where: { deletedAt: null, assignees: { some: { assigneeId } } },
      include: ticketInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  // Reviewer dashboard: user-reported tickets (global reported queue).
  reported() {
    return this.prisma.ticket.findMany({
      where: { deletedAt: null },
      include: ticketInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  // A user's own submitted tickets (the "user" role surface), with a reply count
  // for the list and the engineers it is assigned to.
  reportedBy(userId: number) {
    return this.prisma.ticket.findMany({
      where: { deletedAt: null, userId },
      include: {
        assignees: assigneesInclude,
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // A single ticket the given user reported, with its assigned engineers,
  // replies (oldest first), and diagnostic reports (newest first, each carrying
  // its author's summary). Scoped to `userId` so a user can only open their own
  // tickets. Returns null when no such ticket exists.
  getForReporter(id: number, userId: number) {
    return this.prisma.ticket.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        assignees: assigneesInclude,
        replies: { orderBy: { id: "asc" } },
        reports: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  // Role-scoped KPI counts, computed from ticket status.
  async stats(scope: TicketScope): Promise<TicketStats> {
    const grouped = await this.prisma.ticket.groupBy({
      by: ["status"],
      where: this.scopeWhere(scope),
      _count: { _all: true },
    });

    const stats: TicketStats = { total: 0, open: 0, in_progress: 0, closed: 0 };
    for (const row of grouped) {
      stats[row.status] = row._count._all;
      stats.total += row._count._all;
    }
    return stats;
  }

  // Daily count of tickets created over the last `days` days (inclusive of today),
  // within `scope`, split by their current status. Buckets are computed in
  // application code by UTC calendar day and zero-filled so the chart x-axis is a
  // continuous run of days even when nothing was created.
  async createdTrend(
    scope: TicketScope,
    days = 30,
  ): Promise<TicketTrendPoint[]> {
    // Window start: midnight UTC, (days - 1) days before today.
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));

    const tickets = await this.prisma.ticket.findMany({
      where: { ...this.scopeWhere(scope), createdAt: { gte: start } },
      select: { createdAt: true, status: true },
    });

    // Seed an ordered, zero-filled bucket for every day in the window, keyed by
    // YYYY-MM-DD for O(1) lookups while aggregating.
    const buckets = new Map<string, TicketTrendPoint>();
    for (let i = 0; i < days; i++) {
      const day = new Date(start);
      day.setUTCDate(start.getUTCDate() + i);
      const key = day.toISOString().slice(0, 10);
      buckets.set(key, { date: key, open: 0, in_progress: 0, closed: 0 });
    }

    for (const ticket of tickets) {
      const bucket = buckets.get(ticket.createdAt.toISOString().slice(0, 10));
      if (bucket) bucket[ticket.status] += 1;
    }

    return [...buckets.values()];
  }

  // Reviewer action: set the full list of software-engineers assigned to a ticket.
  // The given list replaces any existing assignment (pass [] to clear).
  async assign(input: AssignTicketInput): Promise<Ticket> {
    const { ticketId, assigneeIds } = assignTicketSchema.parse(input);
    const ids = [...new Set(assigneeIds)];
    await this.assertEngineers(ids);

    return this.prisma.$transaction(async (tx) => {
      await tx.ticketAssignment.deleteMany({ where: { ticketId } });
      if (ids.length > 0) {
        await tx.ticketAssignment.createMany({
          data: ids.map((assigneeId) => ({ ticketId, assigneeId })),
          skipDuplicates: true,
        });
      }
      return tx.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    });
  }

  async create(input: CreateTicketInput): Promise<Ticket> {
    const { assigneeIds, ...data } = createTicketSchema.parse(input);
    const ids = assigneeIds ? [...new Set(assigneeIds)] : [];
    await this.assertEngineers(ids);

    return this.prisma.ticket.create({
      data: {
        ...data,
        assignees: { create: ids.map((assigneeId) => ({ assigneeId })) },
      },
    });
  }

  // Updates a ticket's editable fields (title/description/status). Only fields
  // present in `input` are changed.
  async update(id: number, input: UpdateTicketInput): Promise<Ticket> {
    const data = updateTicketSchema.parse(input);
    return this.prisma.ticket.update({ where: { id }, data });
  }

  // Soft-deletes a ticket: stamps `deletedAt` so it drops out of every listing
  // (which all filter on `deletedAt: null`) while preserving its replies and
  // assignment history.
  async softDelete(id: number): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private scopeWhere(scope: TicketScope) {
    const where: {
      deletedAt: null;
      userId?: number;
      assignees?: { some: { assigneeId: number } };
    } = { deletedAt: null };
    if (scope.kind === "assigned")
      where.assignees = { some: { assigneeId: scope.userId } };
    if (scope.kind === "reported") where.userId = scope.userId;
    return where;
  }

  // Every assignee must be an existing, non-deleted software-engineer.
  private async assertEngineers(assigneeIds: number[]): Promise<void> {
    if (assigneeIds.length === 0) return;
    const found = await this.prisma.user.count({
      where: {
        id: { in: assigneeIds },
        deletedAt: null,
        role: { name: ENGINEER_ROLE },
      },
    });
    if (found !== assigneeIds.length) {
      throw new Error("All assignees must be existing software-engineers");
    }
  }
}

export const ticketService = new TicketService();

export * from "./schemas";
export * from "./types";
