import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

// Every role's first screen is the KPIs overview.
export default async function DashboardIndex() {
  redirect({ href: "/dashboard/kpis", locale: await getLocale() });
}
