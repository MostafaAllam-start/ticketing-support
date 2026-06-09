"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { userService } from "@/services";
import { requireUser } from "@/lib/auth/guards";
import { saveUserImage } from "@/lib/uploads";

export type ProfileState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const schema = z.object({
  name: z.string().min(1),
  jobTitle: z.string().optional(),
  website: z.string().optional(),
  whatsapp: z.string().optional(),
  linkedin: z.string().optional(),
  // Optional new password; blank means "keep current".
  password: z.string().min(8).optional(),
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

function readText(formData: FormData, field: string): string | undefined {
  const raw = formData.get(field);
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

// A signed-in user edits their own profile. The id comes from the session, never
// the form, so a user can only update themselves.
export async function updateProfileAction(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();

  // A freshly uploaded avatar wins; otherwise keep the current image.
  let image: string | undefined;
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    try {
      image = await saveUserImage(file);
    } catch (error) {
      return {
        fieldErrors: {
          image: error instanceof Error ? error.message : "Invalid image",
        },
      };
    }
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    jobTitle: readText(formData, "jobTitle"),
    website: readText(formData, "website"),
    whatsapp: readText(formData, "whatsapp"),
    linkedin: readText(formData, "linkedin"),
    password: readText(formData, "password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const { password, ...rest } = parsed.data;
  try {
    await userService.update(user.id, {
      name: rest.name,
      jobTitle: rest.jobTitle ?? null,
      website: rest.website ?? null,
      whatsapp: rest.whatsapp ?? null,
      linkedin: rest.linkedin ?? null,
      ...(image ? { image } : {}),
      ...(password ? { password } : {}),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }

  revalidatePath("/[locale]/profile", "page");
  return { ok: true };
}
