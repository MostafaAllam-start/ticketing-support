import { attachmentService } from "@/services";

// The lightweight attachment shape the reply thread UI renders (a thumbnail that
// links to the full image).
export type ReplyAttachment = { id: number; url: string };

// Loads every reply's attachments in one query and groups them by reply id, so a
// ticket-detail page can hand the conversation UI each message's attachments
// without an N+1.
export async function replyAttachmentsMap(
  replies: { id: number }[],
): Promise<Record<number, ReplyAttachment[]>> {
  const grouped = await attachmentService.forEntities(
    "reply",
    replies.map((reply) => reply.id),
  );
  const out: Record<number, ReplyAttachment[]> = {};
  for (const [id, attachments] of grouped) {
    out[id] = attachments.map((attachment) => ({
      id: attachment.id,
      url: attachment.url,
    }));
  }
  return out;
}
