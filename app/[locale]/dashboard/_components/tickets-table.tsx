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
import {
  TicketRowActions,
  type EngineerOption,
} from "./ticket-row-actions";

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
  canManage = false,
  engineers = [],
}: {
  tickets: TicketRow[];
  canManage?: boolean;
  engineers?: EngineerOption[];
}) {
  const t = await getTranslations("Dashboard");

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
            {canManage && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
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
              {canManage && (
                <TableCell>
                  <TicketRowActions
                    ticket={{
                      id: ticket.id,
                      title: ticket.title,
                      description: ticket.description,
                      status: ticket.status,
                      assigneeIds: ticket.assignees.map((a) => a.assignee.id),
                    }}
                    engineers={engineers}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
