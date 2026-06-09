import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { companyService } from "@/services";
import { brandCompanyId, requireCompanySelection } from "@/lib/auth/guards";
import { brandKeyForCompany } from "@/lib/companies";
import { AuthScreen } from "../_components/auth-screen";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Company selection comes first — even before the login page.
  await requireCompanySelection();
  const companyId = await brandCompanyId();
  const company = companyId ? await companyService.findById(companyId) : null;
  return (
    <AuthScreen initialMode="login" brand={brandKeyForCompany(company?.name)} />
  );
}
