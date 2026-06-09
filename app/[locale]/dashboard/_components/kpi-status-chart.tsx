"use client";

import { useTranslations } from "next-intl";
import { Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { TicketStats } from "@/services";

// Snapshot of how the in-scope tickets break down by status, as a donut with the
// running total in the center.
export function KpiStatusChart({
  stats,
  isGlobal = true,
}: {
  stats: TicketStats;
  isGlobal?: boolean;
}) {
  const t = useTranslations("Dashboard");

  const chartConfig = {
    open: { label: t("status.open"), color: "var(--chart-1)" },
    in_progress: { label: t("status.in_progress"), color: "var(--chart-3)" },
    closed: { label: t("status.closed"), color: "var(--chart-5)" },
  } satisfies ChartConfig;

  const data = [
    { status: "open", count: stats.open, fill: "var(--color-open)" },
    {
      status: "in_progress",
      count: stats.in_progress,
      fill: "var(--color-in_progress)",
    },
    { status: "closed", count: stats.closed, fill: "var(--color-closed)" },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{t("kpis.statusTitle")}</CardTitle>
        <CardDescription>
          {isGlobal
            ? t("kpis.statusDescriptionGlobal")
            : t("kpis.statusDescriptionScoped")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[260px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="status" />}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-semibold"
                        >
                          {stats.total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 22}
                          className="fill-muted-foreground text-xs"
                        >
                          {t("kpis.total")}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="status" />}
              className="flex-wrap gap-2"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
