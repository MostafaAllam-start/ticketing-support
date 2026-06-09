"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn, keepInputOnError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiImageDropzone } from "@/components/ui/image-dropzone";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createReportAction } from "../ticket-actions";

const textareaClass =
  "w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30";

// Lets the assigned engineer or a consultant add a diagnostic report (issue +
// solution, with optional image attachments) to a ticket from its detail page.
export function ReportFormDialog({ ticketId }: { ticketId: number }) {
  const t = useTranslations("Tickets");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createReportAction, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(t("reportForm.success"));
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus />
          {t("reportForm.add")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} onReset={keepInputOnError(state)} className="grid gap-4">
          <input type="hidden" name="id" value={ticketId} />
          <DialogHeader>
            <DialogTitle>{t("reportForm.title")}</DialogTitle>
            <DialogDescription>{t("reportForm.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="report-issue">{t("reportForm.issue")}</Label>
            <textarea
              id="report-issue"
              name="issue"
              rows={3}
              required
              placeholder={t("reportForm.issuePlaceholder")}
              aria-invalid={Boolean(state.fieldErrors?.issue)}
              className={cn(textareaClass)}
            />
            <FieldError message={state.fieldErrors?.issue} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-solution">{t("reportForm.solution")}</Label>
            <textarea
              id="report-solution"
              name="solution"
              rows={3}
              required
              placeholder={t("reportForm.solutionPlaceholder")}
              aria-invalid={Boolean(state.fieldErrors?.solution)}
              className={cn(textareaClass)}
            />
            <FieldError message={state.fieldErrors?.solution} />
          </div>

          <div className="space-y-2">
            <Label>{t("reportForm.attachments")}</Label>
            <MultiImageDropzone
              name="images"
              invalid={Boolean(state.fieldErrors?.images)}
              texts={{
                hint: t("reportForm.attachmentsHint"),
                types: t("reportForm.attachmentsTypes"),
                remove: t("reportForm.removeImage"),
              }}
            />
            <FieldError message={state.fieldErrors?.images} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("reportForm.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending ? t("reportForm.submitting") : t("reportForm.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
