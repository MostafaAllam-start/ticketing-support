"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { userService } from "@/services";

export async function logoutAction() {
  await userService.logout();
  redirect({ href: "/login", locale: await getLocale() });
}
