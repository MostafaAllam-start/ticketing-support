import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/guards";
import { companyService, projectService, suggestionService } from "@/services";
import { companyRequiresProject } from "@/lib/companies";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TicketsHeader } from "../tickets/_components/tickets-header";
import {
  SuggestDialog,
  type SuggestProjectOption,
} from "../tickets/_components/suggest-dialog";

export default async function MySuggestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const t = await getTranslations("Tickets");

  const suggestions = await suggestionService.listForUser(user.id);

  // CTC users can optionally scope a suggestion to one of their company's
  // projects; ECM users get no project picker.
  let projects: SuggestProjectOption[] | undefined;
  if (user.companyId) {
    const company = await companyService.findById(user.companyId);
    if (company && companyRequiresProject(company.name)) {
      const rows = await projectService.byCompany(user.companyId);
      projects = rows.map((p) => ({ id: p.id, name: p.name }));
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TicketsHeader nav="tickets" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("mySuggestions.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("mySuggestions.subtitle")}
            </p>
          </div>
          <SuggestDialog projects={projects} />
        </div>

        {suggestions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {t("mySuggestions.empty")}
            </p>
            <div className="mt-4 flex justify-center">
              <SuggestDialog projects={projects} />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">{t("table.id")}</TableHead>
                  <TableHead>{t("mySuggestions.tableTitle")}</TableHead>
                  <TableHead>{t("mySuggestions.tableDetails")}</TableHead>
                  <TableHead>{t("mySuggestions.tableCreated")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((suggestion) => (
                  <TableRow key={suggestion.id}>
                    <TableCell className="text-muted-foreground">
                      #{suggestion.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {suggestion.title}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {suggestion.details ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {suggestion.createdAt.toISOString().slice(0, 10)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
