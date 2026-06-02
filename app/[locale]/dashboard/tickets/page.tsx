import { getTranslations, setRequestLocale } from "next-intl/server";
import { canManageTickets, requireDashboardUser } from "@/lib/auth/guards";
import { ticketService, userService } from "@/services";
import { TicketsTable } from "../_components/tickets-table";
import { AddTicketButton } from "../_components/ticket-row-actions";

export default async function TicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireDashboardUser();
  const t = await getTranslations("Dashboard");

  // Engineer sees tickets assigned to them; reviewer (and admin) see the
  // global reported queue and can manage/assign them.
  const canManage = canManageTickets(user.role.name);
  const [tickets, engineers] = await Promise.all([
    user.role.name === "software-engineer"
      ? ticketService.assignedTo(user.id)
      : ticketService.reported(),
    canManage ? userService.engineers() : Promise.resolve([]),
  ]);
  const title =
    user.role.name === "software-engineer"
      ? t("nav.myTickets")
      : t("nav.reportedTickets");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {t("tickets.subtitle")}
          </p>
        </div>
        {canManage && <AddTicketButton engineers={engineers} />}
      </div>
      <TicketsTable
        tickets={tickets}
        canManage={canManage}
        engineers={engineers}
      />
    </div>
  );
}
