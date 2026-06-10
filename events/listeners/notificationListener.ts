import { eventBus } from "../eventBus";
import { DomainEventType } from "../eventTypes";
import type {
  TicketCreatedPayload,
  TicketReplyAddedPayload,
  TicketStatusChangedPayload,
  TicketAssignmentUpdatedPayload,
  ComplaintSubmittedPayload,
  SuggestionCreatedPayload,
  TicketReportSubmittedPayload,
  TicketReportReplyAddedPayload,
} from "../eventTypes";
import { notificationService } from "@/notifications/notificationService";
import { ticketNotificationMessages } from "@/lib/notification-messages";
import {
  projectStaffUserIds,
  replyThreadRecipientIds,
  complaintManagerRecipientIds,
  managersAndReviewersUserIds,
  newAssigneeRecipientIds,
  reportReplyRecipientIds,
  suggestionRecipientIds,
} from "@/lib/ticket-notifications";

// Helper: excludes the actor from the list to avoid self-notification.
function excludeActor(ids: number[], actorId: number): number[] {
  return [...new Set(ids)].filter((id) => id !== actorId);
}

// ─── Listener registration ──────────────────────────────────────────────────────
export function registerNotificationListeners(): void {
  console.log("[NotificationListener] Registering domain event listeners...");

  // ── TICKET_CREATED ──────────────────────────────────────────────────────────
  eventBus.on(DomainEventType.TICKET_CREATED, async (data: TicketCreatedPayload) => {
    const messages = await ticketNotificationMessages();
    const msg = messages.ticketCreated(data.title);
    const recipients = excludeActor(
      await projectStaffUserIds(data.projectId),
      data.actorId,
    );
    if (recipients.length === 0) return;

    await notificationService.notifyMany(recipients, {
      type: "ticket_created",
      title: msg.title,
      details: msg.details,
      entityType: "ticket",
      entityId: data.ticketId,
    });
  });

  // ── TICKET_REPLY_ADDED ──────────────────────────────────────────────────────
  eventBus.on(DomainEventType.TICKET_REPLY_ADDED, async (data: TicketReplyAddedPayload) => {
    const messages = await ticketNotificationMessages();
    // We need the actor's name for the reply message. Fetch it lazily.
    const { userService } = await import("@/services");
    const actor = await userService.findWithRole(data.actorId);
    const actorName = actor?.name ?? "Someone";
    const msg = messages.ticketReply(actorName, data.ticketId);

    const allRecipients = await replyThreadRecipientIds(data.ticketId, data.parentReplyId);
    const recipients = excludeActor(allRecipients, data.actorId);
    if (recipients.length === 0) return;

    await notificationService.notifyMany(recipients, {
      type: "ticket_reply",
      title: msg.title,
      details: msg.details,
      entityType: "ticket",
      entityId: data.ticketId,
    });
  });

  // ── TICKET_STATUS_CHANGED ───────────────────────────────────────────────────
  eventBus.on(DomainEventType.TICKET_STATUS_CHANGED, async (data: TicketStatusChangedPayload) => {
    const messages = await ticketNotificationMessages();
    const msg = messages.ticketStatusChanged(data.ticketId, data.status);
    const recipients = excludeActor(
      await projectStaffUserIds(data.projectId),
      data.actorId,
    );
    if (recipients.length === 0) return;

    await notificationService.notifyMany(recipients, {
      type: "ticket_status_changed",
      title: msg.title,
      details: msg.details,
      entityType: "ticket",
      entityId: data.ticketId,
    });
  });

  // ── TICKET_ASSIGNMENT_UPDATED ───────────────────────────────────────────────
  eventBus.on(DomainEventType.TICKET_ASSIGNMENT_UPDATED, async (data: TicketAssignmentUpdatedPayload) => {
    const messages = await ticketNotificationMessages();

    // Notify staff about assignment change
    const staffMsg = messages.ticketAssigned(data.ticketId);
    const staffRecipients = excludeActor(
      await projectStaffUserIds(data.projectId),
      data.actorId,
    );
    if (staffRecipients.length > 0) {
      await notificationService.notifyMany(staffRecipients, {
        type: "ticket_assigned",
        title: staffMsg.title,
        details: staffMsg.details,
        entityType: "ticket",
        entityId: data.ticketId,
      });
    }

    // Notify newly assigned engineers/consultants
    const newAssignees = await newAssigneeRecipientIds(
      data.previousAssigneeIds,
      data.nextAssigneeIds,
    );
    const assignRecipients = excludeActor(newAssignees, data.actorId);
    if (assignRecipients.length > 0) {
      const assignMsg = messages.ticketAssignedToYou(data.ticketId);
      await notificationService.notifyMany(assignRecipients, {
        type: "ticket_assigned_to_you",
        title: assignMsg.title,
        details: assignMsg.details,
        entityType: "ticket",
        entityId: data.ticketId,
      });
    }
  });

  // ── COMPLAINT_SUBMITTED ─────────────────────────────────────────────────────
  eventBus.on(DomainEventType.COMPLAINT_SUBMITTED, async (data: ComplaintSubmittedPayload) => {
    const messages = await ticketNotificationMessages();
    const msg = messages.complaintSubmitted(data.ticketId);
    const recipients = excludeActor(
      await complaintManagerRecipientIds(data.projectId),
      data.actorId,
    );
    if (recipients.length === 0) return;

    await notificationService.notifyMany(recipients, {
      type: "complaint_submitted",
      title: msg.title,
      details: msg.details,
      entityType: "complaint",
      entityId: data.complaintId,
    });
  });

  // ── SUGGESTION_CREATED ──────────────────────────────────────────────────────
  eventBus.on(DomainEventType.SUGGESTION_CREATED, async (data: SuggestionCreatedPayload) => {
    const messages = await ticketNotificationMessages();
    const msg = messages.suggestionCreated(data.title);
    const recipients = excludeActor(
      await suggestionRecipientIds(data.companyId),
      data.actorId,
    );
    if (recipients.length === 0) return;

    await notificationService.notifyMany(recipients, {
      type: "suggestion_created",
      title: msg.title,
      details: msg.details,
      entityType: "suggestion",
      entityId: data.suggestionId,
    });
  });

  // ── TICKET_REPORT_SUBMITTED ─────────────────────────────────────────────────
  eventBus.on(DomainEventType.TICKET_REPORT_SUBMITTED, async (data: TicketReportSubmittedPayload) => {
    const messages = await ticketNotificationMessages();
    const msg = messages.ticketReportSubmitted(data.ticketId);
    const recipients = excludeActor(
      await managersAndReviewersUserIds(data.projectId),
      data.actorId,
    );
    if (recipients.length === 0) return;

    await notificationService.notifyMany(recipients, {
      type: "ticket_report_submitted",
      title: msg.title,
      details: msg.details,
      entityType: "ticket",
      entityId: data.ticketId,
    });
  });

  // ── TICKET_REPORT_REPLY_ADDED ───────────────────────────────────────────────
  eventBus.on(DomainEventType.TICKET_REPORT_REPLY_ADDED, async (data: TicketReportReplyAddedPayload) => {
    const messages = await ticketNotificationMessages();
    const msg = messages.ticketReportReply(data.ticketId);
    // Include the report's author (engineer / consultant) and thread participants,
    // not just the reviewing staff, so field staff get report replies in real time.
    const recipients = excludeActor(
      await reportReplyRecipientIds(
        data.projectId,
        data.reportId,
        data.parentReplyId,
      ),
      data.actorId,
    );
    if (recipients.length === 0) return;

    await notificationService.notifyMany(recipients, {
      type: "ticket_report_reply",
      title: msg.title,
      details: msg.details,
      entityType: "ticket",
      entityId: data.ticketId,
    });
  });

  console.log("[NotificationListener] All domain event listeners registered.");
}
