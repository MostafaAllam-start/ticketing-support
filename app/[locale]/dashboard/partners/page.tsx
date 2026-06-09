import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { companyService, partnerService } from "@/services";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AddPartnerButton,
  PartnerRowActions,
} from "./_components/partner-actions";

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("admin");
  const t = await getTranslations("Dashboard");

  const [partners, companies] = await Promise.all([
    partnerService.list(),
    companyService.list(),
  ]);
  const companyOptions = companies.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("partners.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("partners.subtitle")}
          </p>
        </div>
        <AddPartnerButton companies={companyOptions} />
      </div>

      {partners.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          {t("partners.empty")}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t("partners.logo")}</TableHead>
                <TableHead>{t("partners.name")}</TableHead>
                <TableHead>{t("partners.details")}</TableHead>
                <TableHead>{t("partners.companies")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    {/* Plain <img> so any logo URL works without next/image config. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="h-9 w-9 rounded-md object-contain"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {partner.details}
                  </TableCell>
                  <TableCell>
                    {partner.companies.length > 0 ? (
                      <span className="flex flex-wrap gap-1">
                        {partner.companies.map((company) => (
                          <Badge key={company.id} variant="secondary">
                            {company.name}
                          </Badge>
                        ))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {t("partners.noCompanies")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <PartnerRowActions
                      partner={{
                        id: partner.id,
                        name: partner.name,
                        logo: partner.logo,
                        details: partner.details,
                        companyIds: partner.companies.map((c) => c.id),
                      }}
                      companies={companyOptions}
                    />
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
