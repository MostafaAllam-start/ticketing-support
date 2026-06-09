import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { ticketService, userService } from "@/services";
import { TicketsTable } from "../_components/tickets-table";
import { AddTicketButton } from "../_components/ticket-row-actions";

export default async function IssuesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("admin");
  const t = await getTranslations("Dashboard");

  const [tickets, assignees] = await Promise.all([
    ticketService.listAll(),
    userService.assignableStaff(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("tickets.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("tickets.subtitle")}
          </p>
        </div>
        <AddTicketButton assignees={assignees} />
      </div>
      <TicketsTable
        tickets={tickets}
        canEdit
        canAssign
        canDelete
        canChangeStatus
        assignees={assignees}
      />
    </div>
  );
}
