import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireDashboardUser } from "@/lib/auth/guards";
import { ticketService } from "@/services";
import type { TicketScope } from "@/services";
import { KpiCards } from "../_components/kpi-cards";
import { KpiStatusChart } from "../_components/kpi-status-chart";
import { KpiTrendChart } from "../_components/kpi-trend-chart";

export default async function KpisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireDashboardUser();
  const t = await getTranslations("Dashboard");

  // Engineer: metrics over assigned tickets. Admin + reviewer: global reported queue.
  const scope: TicketScope =
    user.role.name === "software-engineer"
      ? { kind: "assigned", userId: user.id }
      : { kind: "all" };
  const [stats, trend] = await Promise.all([
    ticketService.stats(scope),
    ticketService.createdTrend(scope, 30),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("kpis.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("kpis.subtitle")}</p>
      </div>
      <KpiCards stats={stats} />
      <div className="grid gap-4 lg:grid-cols-3">
        <KpiStatusChart stats={stats} />
        <div className="lg:col-span-2">
          <KpiTrendChart data={trend} />
        </div>
      </div>
    </div>
  );
}
