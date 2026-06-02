"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { ticketService } from "@/services";
import { requireRole } from "@/lib/auth/guards";
import { ticketStatusValues } from "@/services/ticket-service/schemas";

export type TicketActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

const updateSchema = createSchema.extend({
  status: z.enum(ticketStatusValues),
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

// Checked engineer ids from the assignment checkboxes.
function readAssigneeIds(formData: FormData): number[] {
  return formData
    .getAll("assigneeIds")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
}

// Tickets surface in both the admin Issues view and the reviewer Tickets view.
function revalidate() {
  revalidatePath("/[locale]/dashboard/issues", "page");
  revalidatePath("/[locale]/dashboard/tickets", "page");
}

export async function createTicketAction(
  _prev: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  const me = await requireRole("admin", "reviewer");

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    // The creator is recorded as the reporter; new tickets start "open".
    await ticketService.create({
      ...parsed.data,
      userId: me.id,
      assigneeIds: readAssigneeIds(formData),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save" };
  }

  revalidate();
  return { ok: true };
}

export async function updateTicketAction(
  _prev: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  await requireRole("admin", "reviewer");

  const id = readId(formData);
  if (!id) return { error: "Invalid ticket" };

  const parsed = updateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await ticketService.update(id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save" };
  }

  revalidate();
  return { ok: true };
}

export async function assignTicketAction(
  _prev: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  await requireRole("admin", "reviewer");

  const id = readId(formData);
  if (!id) return { error: "Invalid ticket" };

  try {
    await ticketService.assign({
      ticketId: id,
      assigneeIds: readAssigneeIds(formData),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to assign",
    };
  }

  revalidate();
  return { ok: true };
}

export async function deleteTicketAction(
  _prev: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  await requireRole("admin", "reviewer");

  const id = readId(formData);
  if (!id) return { error: "Invalid ticket" };

  try {
    await ticketService.softDelete(id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete",
    };
  }

  revalidate();
  return { ok: true };
}
