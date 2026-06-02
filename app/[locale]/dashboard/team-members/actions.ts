"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { teamMemberService } from "@/services";
import { requireRole } from "@/lib/auth/guards";
import { saveUserImage } from "@/lib/uploads";

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const fieldsSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  image: z.string().min(1),
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

// "" / missing -> not linked. A positive integer -> link to that user.
function readUserId(formData: FormData): number | null {
  const raw = formData.get("userId");
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function readId(formData: FormData): number | null {
  const n = Number(formData.get("id"));
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Resolve the team member's image. A freshly uploaded file (saved to
// /public/users-images) wins; otherwise fall back to the existing image carried
// in `currentImage` (edit mode). Returns "" when neither is present, which the
// schema then rejects as required. May throw if the upload is an invalid type/size.
async function resolveImage(formData: FormData): Promise<string> {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    return saveUserImage(file);
  }
  const current = formData.get("currentImage");
  return typeof current === "string" ? current : "";
}

// Revalidate both the admin list and the public landing page (which renders the
// team section) so changes show up in both places.
function revalidate() {
  revalidatePath("/[locale]/dashboard/team-members", "page");
  revalidatePath("/[locale]", "page");
}

export async function createTeamMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin");

  let image: string;
  try {
    image = await resolveImage(formData);
  } catch (error) {
    return {
      fieldErrors: {
        image: error instanceof Error ? error.message : "Invalid image",
      },
    };
  }

  const parsed = fieldsSchema.safeParse({
    name: formData.get("name"),
    position: formData.get("position"),
    image,
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await teamMemberService.create({
      ...parsed.data,
      userId: readUserId(formData) ?? undefined,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save" };
  }

  revalidate();
  return { ok: true };
}

export async function updateTeamMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin");

  const id = readId(formData);
  if (!id) return { error: "Invalid team member" };

  let image: string;
  try {
    image = await resolveImage(formData);
  } catch (error) {
    return {
      fieldErrors: {
        image: error instanceof Error ? error.message : "Invalid image",
      },
    };
  }

  const parsed = fieldsSchema.safeParse({
    name: formData.get("name"),
    position: formData.get("position"),
    image,
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await teamMemberService.update(id, {
      ...parsed.data,
      userId: readUserId(formData),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save" };
  }

  revalidate();
  return { ok: true };
}

export async function deleteTeamMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin");

  const id = readId(formData);
  if (!id) return { error: "Invalid team member" };

  try {
    await teamMemberService.delete(id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete" };
  }

  revalidate();
  return { ok: true };
}
