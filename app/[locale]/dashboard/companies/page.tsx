import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { companyService } from "@/services";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AddCompanyButton,
  CompanyRowActions,
} from "./_components/company-actions";

export default async function CompaniesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("admin");
  const t = await getTranslations("Dashboard");

  const companies = await companyService.list();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("companies.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("companies.subtitle")}
          </p>
        </div>
        <AddCompanyButton />
      </div>

      {companies.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          {t("companies.empty")}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t("companies.logo")}</TableHead>
                <TableHead>{t("companies.name")}</TableHead>
                <TableHead>{t("companies.website")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    {/* Plain <img> so any logo URL works without next/image config. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="h-9 w-9 rounded-md object-contain"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    <a
                      href={company.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-foreground hover:underline"
                    >
                      {company.websiteUrl}
                    </a>
                  </TableCell>
                  <TableCell>
                    <CompanyRowActions company={company} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
