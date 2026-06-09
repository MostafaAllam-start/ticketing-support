import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { companyService } from "@/services";
import { brandCompanyId, requireCompanySelection } from "@/lib/auth/guards";
import { brandKeyForCompany } from "@/lib/companies";
import { AuthScreen } from "../_components/auth-screen";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Company selection comes first — even before the register page.
  await requireCompanySelection();
  const companyId = await brandCompanyId();
  const company = companyId ? await companyService.findById(companyId) : null;
  return (
    <AuthScreen
      initialMode="register"
      brand={brandKeyForCompany(company?.name)}
    />
  );
}
