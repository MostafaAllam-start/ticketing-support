"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn, keepInputOnError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { reportIssue } from "../actions";

export type ReportProjectOption = { id: number; name: string };

export function ReportIssueDialog({
  projects,
}: {
  // When provided (CTC reporters), the reporter must pick a project.
  projects?: ReportProjectOption[];
}) {
  const t = useTranslations("Tickets");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(reportIssue, {});

  // On success, close the dialog and confirm. The list refreshes via
  // revalidatePath in the action, so the new ticket appears underneath.
  useEffect(() => {
    if (state.ok) {
      toast.success(t("report.success"));
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          {t("report.button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} onReset={keepInputOnError(state)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("report.title")}</DialogTitle>
            <DialogDescription>{t("report.description")}</DialogDescription>
          </DialogHeader>

          {projects && projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="ticket-project">{t("report.projectLabel")}</Label>
              <select
                id="ticket-project"
                name="projectId"
                defaultValue=""
                aria-invalid={Boolean(state.fieldErrors?.projectId)}
                required
                className={cn(
                  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
                )}
              >
                <option value="" disabled>
                  {t("report.projectPlaceholder")}
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <FieldError message={state.fieldErrors?.projectId} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ticket-title">{t("report.subjectLabel")}</Label>
            <Input
              id="ticket-title"
              name="title"
              placeholder={t("report.subjectPlaceholder")}
              aria-invalid={Boolean(state.fieldErrors?.title)}
              required
            />
            <FieldError message={state.fieldErrors?.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">
              {t("report.descriptionLabel")}
            </Label>
            <textarea
              id="ticket-description"
              name="description"
              rows={5}
              placeholder={t("report.descriptionPlaceholder")}
              aria-invalid={Boolean(state.fieldErrors?.description)}
              required
              className={cn(
                "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
              )}
            />
            <FieldError message={state.fieldErrors?.description} />
          </div>

          <div className="space-y-2">
            <Label>{t("report.attachments")}</Label>
            <MultiImageDropzone
              name="images"
              invalid={Boolean(state.fieldErrors?.images)}
              texts={{
                hint: t("report.attachmentsHint"),
                types: t("report.attachmentsTypes"),
                remove: t("report.removeImage"),
              }}
            />
            <FieldError message={state.fieldErrors?.images} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("report.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending ? t("report.submitting") : t("report.submit")}
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
