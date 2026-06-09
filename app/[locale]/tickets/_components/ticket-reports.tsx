import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { replyAttachmentsMap } from "@/lib/reply-attachments";
import type { ReportAttachment } from "@/lib/report-attachments";
import { replyService } from "@/services";
import { ReportReplies } from "./report-replies";

type Report = {
  id: number;
  issue: string;
  solution: string;
  createdAt: Date;
  user: { name: string };
};

export async function TicketReports({
  ticketId,
  reports,
  attachmentsByReport,
  canReplyToReport,
  currentUserId,
  currentUserRole,
}: {
  ticketId: number;
  reports: Report[];
  attachmentsByReport: Record<number, ReportAttachment[]>;
  canReplyToReport: boolean;
  currentUserId: number;
  currentUserRole: string;
}) {
  const t = await getTranslations("Tickets");

  const repliesByReport = await Promise.all(
    reports.map(async (report) => ({
      reportId: report.id,
      replies: await replyService.forEntity("ticket_report", report.id),
    })),
  );
  const attachmentsByReplyEntries = await Promise.all(
    repliesByReport.map(async ({ reportId, replies }) => [
      reportId,
      await replyAttachmentsMap(replies),
    ] as const),
  );
  const attachmentsByReply = Object.fromEntries(attachmentsByReplyEntries);

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">
        {t("reports.title")}
        {reports.length > 0 && (
          <span className="ms-2 text-sm font-normal text-muted-foreground">
            ({reports.length})
          </span>
        )}
      </h2>

      {reports.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("reports.empty")}
        </div>
      ) : (
        <ol className="space-y-3">
          {reports.map((report) => {
            const attachments = attachmentsByReport[report.id] ?? [];
            const reportReplies =
              repliesByReport.find((item) => item.reportId === report.id)
                ?.replies ?? [];
            return (
              <li key={report.id} className="rounded-lg border p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{t("reports.by", { name: report.user.name })}</span>
                  <span className="tabular-nums">
                    {report.createdAt.toISOString().slice(0, 10)}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t("reports.issue")}
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">{report.issue}</p>
                </div>
                <div className="mt-3 space-y-1 border-t pt-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t("reports.solution")}
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {report.solution}
                  </p>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t("reports.attachments")} ({attachments.length})
                    </h3>
                    <ul className="flex flex-wrap gap-2">
                      {attachments.map((attachment) => (
                        <li key={attachment.id}>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block size-20 overflow-hidden rounded-lg border transition-opacity hover:opacity-90"
                          >
                            <Image
                              src={attachment.url}
                              alt=""
                              width={80}
                              height={80}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <ReportReplies
                  ticketId={ticketId}
                  reportId={report.id}
                  replies={reportReplies}
                  attachmentsByReply={attachmentsByReply[report.id] ?? {}}
                  canReply={canReplyToReport}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
