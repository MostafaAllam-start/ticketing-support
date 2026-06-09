"use client";

import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
import type { TicketTrendPoint } from "@/services";

const SERIES = ["open", "in_progress", "closed"] as const;

// Tickets created per day over the trailing window, stacked by current status.
export function KpiTrendChart({
  data,
  isGlobal = true,
}: {
  data: TicketTrendPoint[];
  isGlobal?: boolean;
}) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();

  const chartConfig = {
    open: { label: t("status.open"), color: "var(--chart-1)" },
    in_progress: { label: t("status.in_progress"), color: "var(--chart-3)" },
    closed: { label: t("status.closed"), color: "var(--chart-5)" },
  } satisfies ChartConfig;

  // ISO day (YYYY-MM-DD) -> short, locale-aware "Mon D". Parsed and formatted in
  // UTC to match how the buckets were keyed server-side.
  const formatDay = (value: string) =>
    new Date(`${value}T00:00:00Z`).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("kpis.trendTitle")}</CardTitle>
        <CardDescription>
          {isGlobal
            ? t("kpis.trendDescriptionGlobal")
            : t("kpis.trendDescriptionScoped")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] w-full"
        >
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={formatDay}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => formatDay(value as string)}
                />
              }
            />
            <defs>
              {SERIES.map((key) => (
                <linearGradient
                  key={key}
                  id={`fill-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            {SERIES.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                stackId="status"
                fill={`url(#fill-${key})`}
                stroke={`var(--color-${key})`}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
