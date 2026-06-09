import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { companyService, userService } from "@/services";
import { brandCompanyId, hasDashboardAccess } from "@/lib/auth/guards";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { CompanySelectForm } from "./_components/company-select-form";

export default async function CompanySelectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Anyone (including anonymous visitors) reaches this entry step. Dashboard
  // users skip it; if a company is already chosen (account or cookie) move on.
  const user = await userService.currentUser();
  if (user && hasDashboardAccess(user)) redirect({ href: "/dashboard", locale });
  if ((await brandCompanyId()) != null) redirect({ href: "/", locale });

  const t = await getTranslations("CompanySelect");
  const companies = await companyService.list();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <Logo imageClassName="h-9" />
        <div className="ms-auto flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <CompanySelectForm
          companies={companies.map((c) => ({
            id: c.id,
            name: c.name,
            logo: c.logo,
          }))}
        />
      </main>
    </div>
  );
}
