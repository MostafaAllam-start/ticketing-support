import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TicketStats } from "@/services";

export async function KpiCards({ stats }: { stats: TicketStats }) {
  const t = await getTranslations("Dashboard");
  const cards = [
    { key: "total", value: stats.total },
    { key: "open", value: stats.open },
    { key: "inProgress", value: stats.in_progress },
    { key: "closed", value: stats.closed },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(`kpis.${card.key}`)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
