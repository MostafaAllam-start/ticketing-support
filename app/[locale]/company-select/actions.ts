"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { companyService, userService } from "@/services";
import { setSelectedCompanyCookie } from "@/lib/company-selection";

export type CompanySelectState = {
  error?: string;
};

// Records the company an (anonymous or signed-in) visitor picked. The choice is
// stored in a cookie so the public surfaces are branded before login; when a user
// is signed in it is also persisted on their account.
export async function selectCompanyAction(
  _prevState: CompanySelectState,
  formData: FormData,
): Promise<CompanySelectState> {
  const companyId = Number(formData.get("companyId"));
  if (!Number.isInteger(companyId) || companyId <= 0) {
    return { error: "Please choose a company." };
  }

  const company = await companyService.findById(companyId);
  if (!company) {
    return { error: "Invalid company." };
  }

  await setSelectedCompanyCookie(companyId);

  const user = await userService.currentUser();
  if (user) {
    await userService.update(user.id, { companyId });
  }

  // Land on the (now company-branded) landing page once the company is set.
  return redirect({ href: "/", locale: await getLocale() });
}
