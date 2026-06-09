"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn, keepInputOnError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitContact } from "./contact-actions";

export function LandingContact() {
  const t = useTranslations("Landing");
  const [state, action, pending] = useActionState(submitContact, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(t("contact.success"));
      formRef.current?.reset();
    }
  }, [state, t]);

  return (
    <section id="contact" className="scroll-mt-16 py-20">
      <div className="mx-auto max-w-xl px-4">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("contact.title")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("contact.subtitle")}</p>
        </div>

        <form ref={formRef} action={action} onReset={keepInputOnError(state)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">{t("contact.name")}</Label>
              <Input
                id="contact-name"
                name="name"
                placeholder={t("contact.namePlaceholder")}
                aria-invalid={Boolean(state.fieldErrors?.name)}
              />
              <FieldError message={state.fieldErrors?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">{t("contact.email")}</Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                placeholder={t("contact.emailPlaceholder")}
                aria-invalid={Boolean(state.fieldErrors?.email)}
              />
              <FieldError message={state.fieldErrors?.email} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-subject">{t("contact.subject")}</Label>
            <Input
              id="contact-subject"
              name="subject"
              placeholder={t("contact.subjectPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-message">{t("contact.message")}</Label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              placeholder={t("contact.messagePlaceholder")}
              aria-invalid={Boolean(state.fieldErrors?.message)}
              className={cn(
                "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
              )}
            />
            <FieldError message={state.fieldErrors?.message} />
          </div>

          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending && <Loader2 className="animate-spin" />}
            {pending ? t("contact.sending") : t("contact.submit")}
          </Button>
        </form>
      </div>
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
