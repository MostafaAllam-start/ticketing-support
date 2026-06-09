import {
  notificationService,
  projectService,
  replyService,
  ticketService,
  userProjectService,
  userService,
} from "@/services";
import type { NotificationEntityType } from "@/services";

const STAFF_ROLES = ["manager", "reviewer"] as const;

export const NotificationType = {
  TicketCreated: "ticket_created",
  TicketReply: "ticket_reply",
  TicketStatusChanged: "ticket_status_changed",
  TicketAssigned: "ticket_assigned",
  TicketAssignedToYou: "ticket_assigned_to_you",
  TicketReportSubmitted: "ticket_report_submitted",
  TicketReportReply: "ticket_report_reply",
  ComplaintSubmitted: "complaint_submitted",
  SuggestionCreated: "suggestion_created",
} as const;

function uniqueIds(ids: number[]): number[] {
  return [...new Set(ids)];
}

function excludeActor(ids: number[], actorId?: number): number[] {
  if (actorId == null) return uniqueIds(ids);
  return uniqueIds(ids.filter((id) => id !== actorId));
}

async function adminUserIds(): Promise<number[]> {
  return userService.activeAdminIds();
}

// All admins + project manager + members with manager/reviewer role.
// Engineers and consultants are never included. ECM tickets (no project) → admins only.
export async function projectStaffUserIds(
  projectId: number | null,
): Promise<number[]> {
  const ids = await adminUserIds();
  if (projectId == null) return ids;

  const managerId = await projectService.managerUserId(projectId);
  if (managerId != null) ids.push(managerId);

  const members = await userProjectService.activeMemberUserIds(
    projectId,
    STAFF_ROLES,
  );
  ids.push(...members);

  return uniqueIds(ids);
}

// Project manager + project reviewers (+ admins for visibility).
export async function managersAndReviewersUserIds(
  projectId: number | null,
): Promise<number[]> {
  const ids = await adminUserIds();
  if (projectId == null) return ids;

  const managerId = await projectService.managerUserId(projectId);
  if (managerId != null) ids.push(managerId);

  const reviewers = await userProjectService.activeMemberUserIds(projectId, [
    "reviewer",
  ]);
  ids.push(...reviewers);

  return uniqueIds(ids);
}

// Project manager + admins (complaint reply access).
export async function complaintManagerRecipientIds(
  projectId: number | null,
): Promise<number[]> {
  const ids = await adminUserIds();
  if (projectId == null) return ids;

  const managerId = await projectService.managerUserId(projectId);
  if (managerId != null) ids.push(managerId);

  return uniqueIds(ids);
}

// All admins + project managers of the given company (project manager field + members with manager role).
export async function suggestionRecipientIds(
  companyId: number,
): Promise<number[]> {
  const ids = await adminUserIds();

  // Find all projects belonging to the company
  const projects = await projectService.byCompany(companyId);
  const projectIds = projects.map((p) => p.id);

  // 1. Project managers from the managerId field
  for (const project of projects) {
    if (project.managerId != null) {
      ids.push(project.managerId);
    }
  }

  // 2. Project managers from project memberships (UserProject) where role is "manager"
  for (const projectId of projectIds) {
    const managers = await userProjectService.activeMemberUserIds(projectId, ["manager"]);
    ids.push(...managers);
  }

  return uniqueIds(ids);
}

// Ticket reporter + thread participants for a conversation reply.
export async function replyThreadRecipientIds(
  ticketId: number,
  parentReplyId?: number | null,
): Promise<number[]> {
  const reporterId = await ticketService.reporterUserId(ticketId);
  if (reporterId == null) return [];

  const ids: number[] = [reporterId];

  if (parentReplyId != null) {
    const parent = await replyService.findById(parentReplyId);
    if (
      parent &&
      parent.entityType === "ticket" &&
      parent.entityId === ticketId
    ) {
      ids.push(parent.userId);
      const siblings = await replyService.authorUserIdsUnderParent(
        "ticket",
        ticketId,
        parentReplyId,
      );
      ids.push(...siblings);
    }
  } else {
    const priorAuthors = await replyService.authorUserIdsOnEntity(
      "ticket",
      ticketId,
    );
    ids.push(...priorAuthors);
  }

  return uniqueIds(ids);
}

// Newly added assignees who are engineers or consultants.
export async function newAssigneeRecipientIds(
  previousIds: number[],
  nextIds: number[],
): Promise<number[]> {
  const added = nextIds.filter((id) => !previousIds.includes(id));
  return userService.fieldStaffIds(added);
}

export async function sendTicketNotification(input: {
  userIds: number[];
  actorId?: number;
  type: string;
  title: string;
  details: string;
  entityType?: NotificationEntityType | null;
  entityId?: number | null;
}): Promise<void> {
  const recipients = excludeActor(input.userIds, input.actorId);
  if (recipients.length === 0) return;

  await notificationService.notifyMany(recipients, {
    type: input.type,
    title: input.title,
    details: input.details,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
  });
}
