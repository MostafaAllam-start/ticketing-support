"use client";

import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { brandKeyForCompany } from "@/lib/companies";
import { changeCompanyAction } from "@/lib/company-actions";

type CompanyOption = { id: number; name: string };

// Header control letting a visitor switch the company they're viewing. The
// trigger shows the current brand's logo; the menu lists every company and
// submits the change to the server controller. Not rendered for admins (they
// see both companies' logos instead — see the dashboard sidebar).
export function CompanySwitcher({
  companies,
  currentCompanyId,
}: {
  companies: CompanyOption[];
  currentCompanyId: number | null;
}) {
  const t = useTranslations("CompanySelect");
  const current = companies.find((c) => c.id === currentCompanyId) ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("switch")}
          className="inline-flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors hover:bg-accent"
        >
          {current ? (
            <Logo
              brand={brandKeyForCompany(current.name)}
              imageClassName="h-5"
            />
          ) : (
            <span className="text-sm text-muted-foreground">{t("switch")}</span>
          )}
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("switch")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((company) => {
          const active = company.id === currentCompanyId;
          return (
            <form key={company.id} action={changeCompanyAction}>
              <input type="hidden" name="companyId" value={company.id} />
              <button
                type="submit"
                className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground"
              >
                <Logo
                  brand={brandKeyForCompany(company.name)}
                  imageClassName="h-4"
                />
                <span className="flex-1 text-start">{company.name}</span>
                {active && <Check className="size-4 text-primary" />}
              </button>
            </form>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
