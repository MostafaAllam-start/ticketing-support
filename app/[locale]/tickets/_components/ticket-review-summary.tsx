import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

// Shown on the ticket detail (reporter + dashboard) once a ticket has been
// closed: who reviewed it, when, and their closing comment. Renders nothing while
// the ticket is still open (reviewedAt is null).
export async function TicketReviewSummary({
  reviewerName,
  reviewedAt,
  comment,
}: {
  reviewerName: string | null;
  reviewedAt: Date | null;
  comment: string | null;
}) {
  if (!reviewedAt) return null;
  const t = await getTranslations("Tickets");

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          <CheckCircle2 className="size-4 text-muted-foreground" />
          {t("review.closedBy", { name: reviewerName ?? "—" })}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {reviewedAt.toISOString().slice(0, 10)}
        </span>
      </div>
      {comment && (
        <p className="mt-2 text-sm whitespace-pre-wrap">{comment}</p>
      )}
    </div>
  );
}
