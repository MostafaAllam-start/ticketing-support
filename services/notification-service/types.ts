import type { z } from "zod";
import type { Notification } from "@/app/generated/prisma/client";
import type { createNotificationSchema } from "./schemas";

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

// Input for fan-out creation: same notification body, many recipients.
export type NotificationBody = Omit<CreateNotificationInput, "userId">;

export type { Notification };
