"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { userService } from "@/services";

// Shared sign-out used by the user-facing avatar menu. Clears the auth cookie and
// returns the visitor to the login page.
export async function signOutAction() {
  await userService.logout();
  redirect({ href: "/login", locale: await getLocale() });
}
