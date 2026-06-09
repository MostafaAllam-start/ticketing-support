import type { z } from "zod";
import type { Reply, ReplyEntityType } from "@/app/generated/prisma/client";
import type { createReplySchema } from "./schemas";

export type CreateReplyInput = z.infer<typeof createReplySchema>;

// A reply with its author loaded (id, name, image, job title, role name). This is
// what the conversation UI consumes so it can show who wrote each message and
// attribute/align it.
export type ReplyWithAuthor = Reply & {
  user: {
    id: number;
    name: string;
    image: string | null;
    jobTitle: string | null;
    role: { name: string };
  };
};

export type { Reply, ReplyEntityType };
