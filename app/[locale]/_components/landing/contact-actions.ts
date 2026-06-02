"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ContactState = {
  ok?: boolean;
  fieldErrors?: Record<string, string>;
};

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  subject: z.string().optional(),
  message: z.string().min(1),
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

export async function submitContact(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  await prisma.contactMessage.create({ data: parsed.data });
  return { ok: true };
}
