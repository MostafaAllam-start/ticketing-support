import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ticketService } from "@/services";
import { TicketRowActions, type AssigneeOption } from "./ticket-row-actions";
import { TicketRow } from "./ticket-row";

// Row shape = whatever the service returns (reporter + assignee summaries included).
type TicketRow = Awaited<ReturnType<(typeof ticketService)["listAll"]>>[number];

// Comma-separated names of the engineers a ticket is assigned to.
function assigneeNames(ticket: TicketRow): string {
  return ticket.assignees.map((a) => a.assignee.name).join(", ");
}

function statusVariant(status: string): "secondary" | "default" | "outline" {
  if (status === "open") return "secondary";
  if (status === "in_progress") return "default";
  return "outline";
}

export async function TicketsTable({
  tickets,
  canEdit = false,
  canAssign = false,
  canDelete = false,
  canChangeStatus = false,
  assignees = [],
}: {
  tickets: TicketRow[];
  canEdit?: boolean;
  canAssign?: boolean;
  canDelete?: boolean;
  canChangeStatus?: boolean;
  assignees?: AssigneeOption[];
}) {
  const t = await getTranslations("Dashboard");
  const showActions = canEdit || canAssign || canDelete || canChangeStatus;

  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        {t("tickets.empty")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">{t("tickets.id")}</TableHead>
            <TableHead>{t("tickets.ticket")}</TableHead>
            <TableHead>{t("tickets.status")}</TableHead>
            <TableHead>{t("tickets.reporter")}</TableHead>
            <TableHead>{t("tickets.assignee")}</TableHead>
            <TableHead>{t("tickets.created")}</TableHead>
            {showActions && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} id={ticket.id} label={ticket.title}>
              <TableCell className="text-muted-foreground">
                #{ticket.id}
              </TableCell>
              <TableCell className="font-medium">{ticket.title}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(ticket.status)}>
                  {t(`status.${ticket.status}`)}
                </Badge>
              </TableCell>
              <TableCell>{ticket.user?.name ?? "—"}</TableCell>
              <TableCell>
                {ticket.assignees.length > 0 ? (
                  assigneeNames(ticket)
                ) : (
                  <span className="text-muted-foreground">
                    {t("tickets.unassigned")}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {ticket.createdAt.toISOString().slice(0, 10)}
              </TableCell>
              {showActions && (
                <TableCell>
                  <TicketRowActions
                    ticket={{
                      id: ticket.id,
                      title: ticket.title,
                      description: ticket.description,
                      status: ticket.status,
                      assigneeIds: ticket.assignees.map((a) => a.assignee.id),
                    }}
                    assignees={assignees}
                    canEdit={canEdit}
                    canAssign={canAssign}
                    canDelete={canDelete}
                    canChangeStatus={canChangeStatus}
                  />
                </TableCell>
              )}
            </TicketRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
