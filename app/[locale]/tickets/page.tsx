import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/guards";
import { ticketService } from "@/services";
import { TicketsHeader } from "./_components/tickets-header";
import { ReportIssueDialog } from "./_components/report-issue-dialog";
import { MyTicketsTable, type MyTicketRow } from "./_components/my-tickets-table";
import { TicketsTableSkeleton } from "./_components/tickets-skeletons";

export default async function TicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Auth gate runs first (handles redirects) so the shell never flashes for an
  // unauthenticated visitor.
  const user = await requireUser();
  const t = await getTranslations("Tickets");

  return (
    <div className="flex min-h-screen flex-col">
      <TicketsHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <ReportIssueDialog />
        </div>

        {/* The shell above renders immediately; the table streams in once the
            tickets query resolves, showing a skeleton until then. */}
        <Suspense fallback={<TicketsTableSkeleton />}>
          <TicketsList userId={user.id} />
        </Suspense>
      </main>
    </div>
  );
}

async function TicketsList({ userId }: { userId: number }) {
  const t = await getTranslations("Tickets");
  const tickets = await ticketService.reportedBy(userId);

  // Serialize to primitives for the client table (Date -> ISO date string).
  const rows: MyTicketRow[] = tickets.map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    created: ticket.createdAt.toISOString().slice(0, 10),
    replyCount: ticket._count.replies,
  }));

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
        <div className="mt-4 flex justify-center">
          <ReportIssueDialog />
        </div>
      </div>
    );
  }

  return <MyTicketsTable tickets={rows} />;
}
