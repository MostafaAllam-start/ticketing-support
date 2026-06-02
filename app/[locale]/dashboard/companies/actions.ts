"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { companyService } from "@/services";
import { requireRole } from "@/lib/auth/guards";
import { saveUserImage } from "@/lib/uploads";

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const fieldsSchema = z.object({
  name: z.string().min(1),
  logo: z.string().min(1),
  websiteUrl: z.string().min(1),
});

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

function readId(formData: FormData): number | null {
  const n = Number(formData.get("id"));
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Resolve the company's logo. A freshly uploaded file (saved to
// /public/users-images) wins; otherwise fall back to the existing logo carried
// in `currentLogo` (edit mode). Returns "" when neither is present, which the
// schema then rejects as required. May throw if the upload is an invalid type/size.
async function resolveLogo(formData: FormData): Promise<string> {
  const file = formData.get("logoFile");
  if (file instanceof File && file.size > 0) {
    return saveUserImage(file);
  }
  const current = formData.get("currentLogo");
  return typeof current === "string" ? current : "";
}

function revalidate() {
  revalidatePath("/[locale]/dashboard/companies", "page");
}

export async function createCompanyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin");

  let logo: string;
  try {
    logo = await resolveLogo(formData);
  } catch (error) {
    return {
      fieldErrors: {
        logo: error instanceof Error ? error.message : "Invalid image",
      },
    };
  }

  const parsed = fieldsSchema.safeParse({
    name: formData.get("name"),
    logo,
    websiteUrl: formData.get("websiteUrl"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await companyService.create(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save" };
  }

  revalidate();
  return { ok: true };
}

export async function updateCompanyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin");

  const id = readId(formData);
  if (!id) return { error: "Invalid company" };

  let logo: string;
  try {
    logo = await resolveLogo(formData);
  } catch (error) {
    return {
      fieldErrors: {
        logo: error instanceof Error ? error.message : "Invalid image",
      },
    };
  }

  const parsed = fieldsSchema.safeParse({
    name: formData.get("name"),
    logo,
    websiteUrl: formData.get("websiteUrl"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await companyService.update(id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save" };
  }

  revalidate();
  return { ok: true };
}

export async function deleteCompanyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin");

  const id = readId(formData);
  if (!id) return { error: "Invalid company" };

  try {
    await companyService.delete(id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete" };
  }

  revalidate();
  return { ok: true };
}
