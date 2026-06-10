import { prisma } from "@/lib/prisma";
import { Notification, NotificationEntityType } from "@/app/generated/prisma/client";

const DEFAULT_LIMIT = 20;

export class NotificationRepository {
  async create(data: {
    userId: number;
    type: string;
    title: string;
    details: string;
    entityType?: NotificationEntityType | null;
    entityId?: number | null;
  }): Promise<Notification> {
    return prisma.notification.create({
      data: {
        ...data,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
      },
    });
  }

  async createMany(
    userIds: number[],
    body: {
      type: string;
      title: string;
      details: string;
      entityType?: NotificationEntityType | null;
      entityId?: number | null;
    },
  ): Promise<Notification[]> {
    const uniqueUserIds = [...new Set(userIds)];
    if (uniqueUserIds.length === 0) return [];

    return prisma.$transaction(
      uniqueUserIds.map((userId) =>
        prisma.notification.create({
          data: {
            ...body,
            userId,
            entityType: body.entityType ?? null,
            entityId: body.entityId ?? null,
          },
        })
      )
    );
  }

  async listForUser(
    userId: number,
    options: { unreadOnly?: boolean; limit?: number } = {},
  ): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId, ...(options.unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: options.limit ?? DEFAULT_LIMIT,
    });
  }

  async unreadCount(userId: number): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markRead(id: number, userId: number): Promise<boolean> {
    const result = await prisma.notification.updateMany({
      where: { id, userId, isRead: false },
      data: { isRead: true },
    });
    return result.count > 0;
  }

  async markAllRead(userId: number): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await prisma.notification.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }
}

export const notificationRepository = new NotificationRepository();
