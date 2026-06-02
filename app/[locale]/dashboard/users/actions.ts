"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { userService } from "@/services";
import { requireRole } from "@/lib/auth/guards";
import { saveUserImage } from "@/lib/uploads";

// Initial password for admin-created accounts. The create form has no password
// field; the value comes from the environment (falling back to a sane default).
const DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD ?? "support@123";

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// Shared identity fields. `password` is required on create and optional on edit
// (blank = keep current), so it's validated separately.
const identitySchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  email: z.email(),
  role: z.string().min(1),
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

// "" / missing -> undefined; otherwise the trimmed string.
function readOptional(formData: FormData, key: string): string | undefined {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  return raw.trim();
}

// Resolve the user's avatar image. A freshly uploaded file (saved to
// /public/users-images) wins; otherwise fall back to the existing image carried
// in `currentImage` (edit mode). Returns null when neither is present — the user
// has no photo and the UI shows an initials avatar. May throw on bad type/size.
async function resolveImage(formData: FormData): Promise<string | null> {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    return saveUserImage(file);
  }
  const current = formData.get("currentImage");
  return typeof current === "string" && current.trim() !== "" ? current : null;
}

function revalidate() {
  revalidatePath("/[locale]/dashboard/users", "page");
}

export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin");

  const parsed = identitySchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  let image: string | null;
  try {
    image = await resolveImage(formData);
  } catch (error) {
    return {
      fieldErrors: {
        image: error instanceof Error ? error.message : "Invalid image",
      },
    };
  }

  const { role, ...identity } = parsed.data;
  try {
    await userService.register(
      {
        ...identity,
        // Admin-created accounts get a shared default password (no form field).
        password: DEFAULT_USER_PASSWORD,
        jobTitle: readOptional(formData, "jobTitle"),
        image: image ?? undefined,
      },
      role,
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save" };
  }

  revalidate();
  return { ok: true };
}

export async function updateUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin");

  const id = readId(formData);
  if (!id) return { error: "Invalid user" };

  const parsed = identitySchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  const password = readOptional(formData, "password"); // blank = keep current

  const fieldErrors: Record<string, string> = parsed.success
    ? {}
    : fieldErrorsFrom(parsed.error);
  if (password !== undefined && password.length < 8) {
    fieldErrors.password = "Password must be at least 8 characters";
  }
  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  let image: string | null;
  try {
    image = await resolveImage(formData);
  } catch (error) {
    return {
      fieldErrors: {
        image: error instanceof Error ? error.message : "Invalid image",
      },
    };
  }

  try {
    await userService.update(id, {
      ...parsed.data,
      password,
      image,
      // A null clears the column; undefined would leave it unchanged.
      jobTitle: readOptional(formData, "jobTitle") ?? null,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save" };
  }

  revalidate();
  return { ok: true };
}

// Disables or re-enables an account based on the `disabled` flag. An admin cannot
// disable their own account (which would lock them out mid-session).
export async function setUserDisabledAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireRole("admin");

  const id = readId(formData);
  if (!id) return { error: "Invalid user" };

  const disabled = formData.get("disabled") === "true";
  if (disabled && id === admin.id) {
    return { error: "You cannot disable your own account." };
  }

  try {
    if (disabled) {
      await userService.disable(id);
    } else {
      await userService.enable(id);
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update" };
  }

  revalidate();
  return { ok: true };
}
