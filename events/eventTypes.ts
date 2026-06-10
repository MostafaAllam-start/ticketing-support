export enum DomainEventType {
  TICKET_CREATED = "TICKET_CREATED",
  TICKET_REPLY_ADDED = "TICKET_REPLY_ADDED",
  TICKET_STATUS_CHANGED = "TICKET_STATUS_CHANGED",
  TICKET_ASSIGNMENT_UPDATED = "TICKET_ASSIGNMENT_UPDATED",
  COMPLAINT_SUBMITTED = "COMPLAINT_SUBMITTED",
  SUGGESTION_CREATED = "SUGGESTION_CREATED",
  TICKET_REPORT_SUBMITTED = "TICKET_REPORT_SUBMITTED",
  TICKET_REPORT_REPLY_ADDED = "TICKET_REPORT_REPLY_ADDED",
}

export interface TicketCreatedPayload {
  ticketId: number;
  actorId: number;
  title: string;
  projectId: number | null;
}

export interface TicketReplyAddedPayload {
  ticketId: number;
  actorId: number;
  parentReplyId?: number | null;
  description: string;
}

export interface TicketStatusChangedPayload {
  ticketId: number;
  actorId: number;
  status: string;
  projectId: number | null;
}

export interface TicketAssignmentUpdatedPayload {
  ticketId: number;
  actorId: number;
  projectId: number | null;
  previousAssigneeIds: number[];
  nextAssigneeIds: number[];
}

export interface ComplaintSubmittedPayload {
  complaintId: number;
  ticketId: number;
  actorId: number;
  projectId: number | null;
}

export interface SuggestionCreatedPayload {
  suggestionId: number;
  companyId: number;
  actorId: number;
  title: string;
  projectId: number | null;
}

export interface TicketReportSubmittedPayload {
  ticketId: number;
  actorId: number;
  projectId: number | null;
}

export interface TicketReportReplyAddedPayload {
  ticketId: number;
  reportId: number;
  actorId: number;
  projectId: number | null;
  parentReplyId?: number | null;
}

export interface DomainEventMap {
  [DomainEventType.TICKET_CREATED]: TicketCreatedPayload;
  [DomainEventType.TICKET_REPLY_ADDED]: TicketReplyAddedPayload;
  [DomainEventType.TICKET_STATUS_CHANGED]: TicketStatusChangedPayload;
  [DomainEventType.TICKET_ASSIGNMENT_UPDATED]: TicketAssignmentUpdatedPayload;
  [DomainEventType.COMPLAINT_SUBMITTED]: ComplaintSubmittedPayload;
  [DomainEventType.SUGGESTION_CREATED]: SuggestionCreatedPayload;
  [DomainEventType.TICKET_REPORT_SUBMITTED]: TicketReportSubmittedPayload;
  [DomainEventType.TICKET_REPORT_REPLY_ADDED]: TicketReportReplyAddedPayload;
}
