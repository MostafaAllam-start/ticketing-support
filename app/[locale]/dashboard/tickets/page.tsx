import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  managedProjectIds,
  memberProjectIds,
  requireDashboardUser,
} from "@/lib/auth/guards";
import { ticketService, userService } from "@/services";
import { UserRole } from "@/lib/auth/roles";
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

  const isEngineer = user.role.name === "software-engineer";
  const isManager = user.role.name === "manager";
  const isReviewer = user.role.name === "reviewer";
  const isConsultant = user.role.name === "sap-consultant";
  const isAdmin = user.userRole === UserRole.Admin;

  const tickets = isAdmin
    ? await ticketService.listAll()
    : isManager
      ? await ticketService.forProjects(await managedProjectIds(user))
      : isReviewer
        ? await ticketService.forProjects(memberProjectIds(user))
        : isEngineer || isConsultant
          ? await ticketService.assignedTo(user.id)
          : [];

  const canAddTicket = isAdmin || isManager;
  const canEditTicket = isAdmin || isManager;
  const canDeleteTicket = isAdmin || isManager;
  const canAssignTicket = isAdmin || isManager || isReviewer;
  const canChangeStatus = isAdmin || isManager || isReviewer;
  const assignees = canAssignTicket
    ? await userService.assignableStaff()
    : [];

  const title = isAdmin
    ? t("tickets.title")
    : isManager || isReviewer
      ? t("nav.projectTickets")
      : t("nav.myTickets");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {t("tickets.subtitle")}
          </p>
        </div>
        {canAddTicket && <AddTicketButton assignees={assignees} />}
      </div>
      <TicketsTable
        tickets={tickets}
        canEdit={canEditTicket}
        canAssign={canAssignTicket}
        canDelete={canDeleteTicket}
        canChangeStatus={canChangeStatus}
        assignees={assignees}
      />
    </div>
  );
}
