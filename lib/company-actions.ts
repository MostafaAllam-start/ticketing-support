"use server";

import { revalidatePath } from "next/cache";
import { companyService, userService } from "@/services";
import { hasDashboardAccess } from "@/lib/auth/guards";
import { setSelectedCompanyCookie } from "@/lib/company-selection";

// Controller for the in-header company switcher: lets a visitor change the
// company they're currently viewing. The choice is stored in a cookie so the
// public surfaces (landing/auth) re-brand immediately, and for a signed-in
// "user" it is also persisted on their account. Admins span both companies and
// are never branded to one, so their account is left untouched.
export async function changeCompanyAction(formData: FormData): Promise<void> {
  const companyId = Number(formData.get("companyId"));
  if (!Number.isInteger(companyId) || companyId <= 0) return;

  const company = await companyService.findById(companyId);
  if (!company) return;

  await setSelectedCompanyCookie(companyId);

  const user = await userService.currentUser();
  if (user && !hasDashboardAccess(user)) {
    await userService.update(user.id, { companyId });
  }

  // Re-render every route under the new brand (header logo, landing copy, the
  // CTC-only project picker, etc.).
  revalidatePath("/", "layout");
}
