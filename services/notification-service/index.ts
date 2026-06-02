import { Service } from "../service";
import { createNotificationSchema } from "./schemas";
import type { CreateNotificationInput, NotificationBody } from "./types";
import type { Notification } from "@/app/generated/prisma/client";

const DEFAULT_LIMIT = 20;

export class NotificationService extends Service {
  // Creates a single notification addressed to one user.
  async create(input: CreateNotificationInput): Promise<Notification> {
    const data = createNotificationSchema.parse(input);
    return this.prisma.notification.create({
      data: { ...data, entityId: data.entityId ?? null },
    });
  }

  // Fans the same notification out to many recipients in one insert (e.g. every
  // engineer assigned to a ticket). Duplicate ids are collapsed. Returns the
  // number of rows created.
  async notifyMany(
    userIds: number[],
    body: NotificationBody,
  ): Promise<number> {
    const base = createNotificationSchema.omit({ userId: true }).parse(body);
    const ids = [...new Set(userIds)];
    if (ids.length === 0) return 0;

    const result = await this.prisma.notification.createMany({
      data: ids.map((userId) => ({
        ...base,
        userId,
        entityId: base.entityId ?? null,
      })),
    });
    return result.count;
  }

  // A user's notifications, newest first. Pass `unreadOnly` to filter to unread,
  // and `limit` to cap how many are returned (defaults to 20).
  listForUser(
    userId: number,
    options: { unreadOnly?: boolean; limit?: number } = {},
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId, ...(options.unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: options.limit ?? DEFAULT_LIMIT,
    });
  }

  unreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // Marks one notification read. Scoped to `userId` so a user can only touch
  // their own notifications. Returns true when a row was updated.
  async markRead(id: number, userId: number): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId, isRead: false },
      data: { isRead: true },
    });
    return result.count > 0;
  }

  // Marks all of a user's unread notifications read. Returns the count updated.
  async markAllRead(userId: number): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  // Deletes one notification, scoped to its owner. Returns true when removed.
  async delete(id: number, userId: number): Promise<boolean> {
    const result = await this.prisma.notification.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }
}

export const notificationService = new NotificationService();

export * from "./schemas";
export * from "./types";
