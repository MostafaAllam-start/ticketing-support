"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MyTicketRowActions } from "./my-ticket-actions";

export type MyTicketRow = {
  id: number;
  title: string;
  description: string;
  status: "open" | "in_progress" | "closed";
  created: string;
  replyCount: number;
};

function statusVariant(status: string): "secondary" | "default" | "outline" {
  if (status === "open") return "secondary";
  if (status === "in_progress") return "default";
  return "outline";
}

export function MyTicketsTable({ tickets }: { tickets: MyTicketRow[] }) {
  const t = useTranslations("Tickets");
  const router = useRouter();

  const open = (id: number) => router.push(`/tickets/${id}`);

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">{t("table.id")}</TableHead>
            <TableHead>{t("table.subject")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead>{t("table.replies")}</TableHead>
            <TableHead>{t("table.created")}</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              role="link"
              tabIndex={0}
              onDoubleClick={() => open(ticket.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  open(ticket.id);
                }
              }}
              className="cursor-pointer select-none"
            >
              <TableCell className="text-muted-foreground">
                #{ticket.id}
              </TableCell>
              <TableCell className="font-medium">{ticket.title}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(ticket.status)}>
                  {t(`status.${ticket.status}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {ticket.replyCount}
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {ticket.created}
              </TableCell>
              <TableCell>
                <MyTicketRowActions
                  ticket={{
                    id: ticket.id,
                    title: ticket.title,
                    description: ticket.description,
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
