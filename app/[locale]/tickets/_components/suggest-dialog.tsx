"use client";

import { useActionState, useEffect, useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
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
import { submitSuggestionAction, type ReportState } from "../actions";

export type SuggestProjectOption = { id: number; name: string };

export function SuggestDialog({
  projects,
}: {
  // The selected company's projects (CTC only). When provided, the user may
  // optionally scope the suggestion to one of them.
  projects?: SuggestProjectOption[];
}) {
  const t = useTranslations("Tickets");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ReportState, FormData>(
    submitSuggestionAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(t("suggest.success"));
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lightbulb />
          {t("suggest.button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} onReset={keepInputOnError(state)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("suggest.title")}</DialogTitle>
            <DialogDescription>{t("suggest.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="suggest-title">{t("suggest.subjectLabel")}</Label>
            <Input
              id="suggest-title"
              name="title"
              placeholder={t("suggest.subjectPlaceholder")}
              aria-invalid={Boolean(state.fieldErrors?.title)}
              required
            />
            <FieldError message={state.fieldErrors?.title} />
          </div>

          {projects && projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="suggest-project">
                {t("suggest.projectLabel")}
              </Label>
              <select
                id="suggest-project"
                name="projectId"
                defaultValue=""
                aria-invalid={Boolean(state.fieldErrors?.projectId)}
                className={cn(
                  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
                )}
              >
                <option value="">{t("suggest.projectPlaceholder")}</option>
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
            <Label htmlFor="suggest-details">{t("suggest.detailsLabel")}</Label>
            <textarea
              id="suggest-details"
              name="details"
              rows={5}
              placeholder={t("suggest.detailsPlaceholder")}
              aria-invalid={Boolean(state.fieldErrors?.details)}
              className={cn(
                "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
              )}
            />
            <FieldError message={state.fieldErrors?.details} />
          </div>

          <div className="space-y-2">
            <Label>{t("suggest.attachments")}</Label>
            <MultiImageDropzone
              name="images"
              invalid={Boolean(state.fieldErrors?.images)}
              texts={{
                hint: t("suggest.attachmentsHint"),
                types: t("suggest.attachmentsTypes"),
                remove: t("suggest.removeImage"),
              }}
            />
            <FieldError message={state.fieldErrors?.images} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("suggest.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending ? t("suggest.submitting") : t("suggest.submit")}
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
