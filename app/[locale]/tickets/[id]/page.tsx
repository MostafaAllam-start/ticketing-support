import { Suspense } from "react";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { imageService, ticketService } from "@/services";
import { Badge } from "@/components/ui/badge";
import { TicketsHeader } from "../_components/tickets-header";
import { TicketDetailSkeleton } from "../_components/tickets-skeletons";

function statusVariant(status: string): "secondary" | "default" | "outline" {
  if (status === "open") return "secondary";
  if (status === "in_progress") return "default";
  return "outline";
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await requireUser();

  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) notFound();

  const t = await getTranslations("Tickets");

  return (
    <div className="flex min-h-screen flex-col">
      <TicketsHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <Link
          href="/tickets"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
          {t("detail.back")}
        </Link>

        {/* Back link + header stay; the ticket body streams in with a skeleton. */}
        <Suspense fallback={<TicketDetailSkeleton />}>
          <TicketDetail ticketId={ticketId} userId={user.id} />
        </Suspense>
      </main>
    </div>
  );
}

async function TicketDetail({
  ticketId,
  userId,
}: {
  ticketId: number;
  userId: number;
}) {
  // Scoped to the current user, so opening someone else's (or a missing) ticket
  // 404s rather than leaking it.
  const ticket = await ticketService.getForReporter(ticketId, userId);
  if (!ticket) notFound();

  const t = await getTranslations("Tickets");
  const created = ticket.createdAt.toISOString().slice(0, 10);
  const images = await imageService.forEntity("ticket", ticket.id);

  return (
    <>
      <article className="rounded-xl border p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">#{ticket.id}</p>
            <h1 className="text-xl font-semibold tracking-tight">
              {ticket.title}
            </h1>
          </div>
          <Badge variant={statusVariant(ticket.status)}>
            {t(`status.${ticket.status}`)}
          </Badge>
        </div>

        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-muted-foreground">{t("detail.created")}</dt>
            <dd className="tabular-nums">{created}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">{t("detail.assignee")}</dt>
            <dd>
              {ticket.assignees.length > 0 ? (
                ticket.assignees.map((a) => a.assignee.name).join(", ")
              ) : (
                <span className="text-muted-foreground">
                  {t("detail.unassigned")}
                </span>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-5 border-t pt-5">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {t("detail.description")}
          </h2>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {images.length > 0 && (
          <div className="mt-5 border-t pt-5">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              {t("detail.attachments")} ({images.length})
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image) => (
                <li key={image.id}>
                  <a
                    href={image.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-video overflow-hidden rounded-lg border transition-opacity hover:opacity-90"
                  >
                    <Image
                      src={image.path}
                      alt=""
                      width={320}
                      height={180}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">
          {t("replies.title")}
          {ticket.replies.length > 0 && (
            <span className="ms-2 text-sm font-normal text-muted-foreground">
              ({ticket.replies.length})
            </span>
          )}
        </h2>

        {ticket.replies.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("replies.empty")}
          </div>
        ) : (
          <ol className="space-y-3">
            {ticket.replies.map((reply) => (
              <li
                key={reply.id}
                className="rounded-lg border bg-muted/40 p-4 text-sm whitespace-pre-wrap"
              >
                {reply.description}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">
          {t("reports.title")}
          {ticket.reports.length > 0 && (
            <span className="ms-2 text-sm font-normal text-muted-foreground">
              ({ticket.reports.length})
            </span>
          )}
        </h2>

        {ticket.reports.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("reports.empty")}
          </div>
        ) : (
          <ol className="space-y-3">
            {ticket.reports.map((report) => (
              <li key={report.id} className="rounded-lg border p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {t("reports.by", { name: report.user.name })}
                  </span>
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
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
