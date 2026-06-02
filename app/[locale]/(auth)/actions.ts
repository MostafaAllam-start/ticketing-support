"use server";

import type { z } from "zod";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { userService, loginSchema, registerFormSchema } from "@/services";
import { isPrivileged } from "@/lib/auth/guards";

type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

// Reduces a ZodError to the first message per field — uses only `error.issues`,
// which is stable across zod versions.
function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && out[key] === undefined) {
      out[key] = issue.message;
    }
  }
  return out;
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await userService.login(parsed.data);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to sign in.",
    };
  }

  // Success: cookie is set inside userService.login(). redirect() must be called
  // outside the try/catch because it works by throwing. Privileged roles go to
  // the dashboard; everyone else to the landing page. The locale-aware redirect
  // keeps the active /en or /ar prefix.
  const me = await userService.currentUser();
  const href = me && isPrivileged(me.role.name) ? "/dashboard" : "/";
  return redirect({ href, locale: await getLocale() });
}

export async function registerAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerFormSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  // Drop the UI-only confirmation before handing off to the service.
  const { confirmPassword: _confirmPassword, ...data } = parsed.data;

  try {
    // Role defaults to "user" inside the service.
    await userService.register(data);
    // Auto sign-in so the new user lands authenticated.
    await userService.login({
      identifier: data.username,
      password: data.password,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create account.",
    };
  }

  return redirect({ href: "/", locale: await getLocale() });
}
