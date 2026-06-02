"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { imageService, ticketService, userService } from "@/services";
import { requireUser } from "@/lib/auth/guards";
import { assertValidImages, readImageFiles, saveImages } from "@/lib/storage";

export type ReportState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// The reporter (userId) is taken from the session, never the form, so a user can
// only file tickets as themselves. A reporter may set the title/description but
// never the status or the assigned engineers.
const reportSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

function readId(formData: FormData): number | null {
  const n = Number(formData.get("id"));
  return Number.isInteger(n) && n > 0 ? n : null;
}

function revalidateTickets() {
  revalidatePath("/[locale]/tickets", "page");
  revalidatePath("/[locale]/tickets/[id]", "page");
}

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

export async function reportIssue(
  _prevState: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const user = await userService.currentUser();
  if (!user) {
    return { error: "You must be signed in to report an issue." };
  }

  const parsed = reportSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  // Validate attachments before creating the ticket so a bad upload doesn't leave
  // a half-created record.
  const files = readImageFiles(formData);
  try {
    assertValidImages(files);
  } catch (error) {
    return {
      fieldErrors: {
        images: error instanceof Error ? error.message : "Invalid images",
      },
    };
  }

  const ticket = await ticketService.create({ ...parsed.data, userId: user.id });
  const paths = await saveImages(files);
  await imageService.attach("ticket", ticket.id, paths);

  // Refresh the list so the new ticket shows up once the dialog closes.
  revalidateTickets();
  return { ok: true };
}

// A reporter edits one of their own tickets (title/description only). Ownership is
// enforced by scoping the lookup to the current user's id.
export async function updateMyTicketAction(
  _prevState: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const user = await requireUser();

  const id = readId(formData);
  if (!id) return { error: "Invalid ticket" };

  const ticket = await ticketService.getForReporter(id, user.id);
  if (!ticket) return { error: "Ticket not found" };

  const parsed = reportSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  await ticketService.update(id, parsed.data);
  revalidateTickets();
  return { ok: true };
}

// A reporter deletes (soft) one of their own tickets.
export async function deleteMyTicketAction(
  _prevState: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const user = await requireUser();

  const id = readId(formData);
  if (!id) return { error: "Invalid ticket" };

  const ticket = await ticketService.getForReporter(id, user.id);
  if (!ticket) return { error: "Ticket not found" };

  await ticketService.softDelete(id);
  revalidatePath("/[locale]/tickets", "page");
  return { ok: true };
}

export async function signOutAction() {
  await userService.logout();
  redirect({ href: "/login", locale: await getLocale() });
}
