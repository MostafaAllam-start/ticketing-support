"use client";

import { TicketReplies } from "./ticket-replies";
import type { ReplyWithAuthor } from "@/services";
import type { ReplyAttachment } from "@/lib/reply-attachments";
import {
  deleteReportReplyAction,
  postReportReplyAction,
  updateReportReplyAction,
} from "../../dashboard/reply-actions";

const reportReplyActions = {
  post: postReportReplyAction,
  update: updateReportReplyAction,
  delete: deleteReportReplyAction,
};

export function ReportReplies({
  ticketId,
  reportId,
  replies,
  attachmentsByReply,
  canReply,
  currentUserId,
  currentUserRole,
}: {
  ticketId: number;
  reportId: number;
  replies: ReplyWithAuthor[];
  attachmentsByReply: Record<number, ReplyAttachment[]>;
  canReply: boolean;
  currentUserId: number;
  currentUserRole: string;
}) {
  return (
    <TicketReplies
      entityForm={{
        entityField: "entityId",
        entityId: reportId,
        extraFields: { ticketId },
      }}
      actions={reportReplyActions}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
      replies={replies}
      attachmentsByReply={attachmentsByReply}
      canReply={canReply}
      compact
    />
  );
}
