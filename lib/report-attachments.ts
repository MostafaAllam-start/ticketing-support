import { attachmentService } from "@/services";

// The lightweight attachment shape the report view renders (a thumbnail that
// links to the full image).
export type ReportAttachment = { id: number; url: string };

// Loads every report's attachments in one query and groups them by report id, so
// a ticket-detail page can show each diagnostic report's attachments without an
// N+1.
export async function reportAttachmentsMap(
  reports: { id: number }[],
): Promise<Record<number, ReportAttachment[]>> {
  const grouped = await attachmentService.forEntities(
    "ticket_report",
    reports.map((report) => report.id),
  );
  const out: Record<number, ReportAttachment[]> = {};
  for (const [id, attachments] of grouped) {
    out[id] = attachments.map((attachment) => ({
      id: attachment.id,
      url: attachment.url,
    }));
  }
  return out;
}
