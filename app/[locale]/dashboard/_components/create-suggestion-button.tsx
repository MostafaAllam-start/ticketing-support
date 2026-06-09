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
import {
  createSuggestionAction,
  type SuggestionState,
} from "../suggestion-actions";

export type SuggestionProjectOption = { id: number; name: string };

export function CreateSuggestionButton({
  projects,
}: {
  // The selected company's projects. When provided, the suggestion may be
  // optionally scoped to one of them.
  projects?: SuggestionProjectOption[];
}) {
  const t = useTranslations("Dashboard");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SuggestionState, FormData>(
    createSuggestionAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(t("suggestions.success"));
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
          {t("suggestions.create")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} onReset={keepInputOnError(state)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("suggestions.title")}</DialogTitle>
            <DialogDescription>
              {t("suggestions.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="suggestion-title">
              {t("suggestions.titleLabel")}
            </Label>
            <Input
              id="suggestion-title"
              name="title"
              aria-invalid={Boolean(state.fieldErrors?.title)}
              required
            />
            <FieldError message={state.fieldErrors?.title} />
          </div>

          {projects && projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="suggestion-project">
                {t("suggestions.projectLabel")}
              </Label>
              <select
                id="suggestion-project"
                name="projectId"
                defaultValue=""
                aria-invalid={Boolean(state.fieldErrors?.projectId)}
                className={cn(
                  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
                )}
              >
                <option value="">{t("suggestions.projectPlaceholder")}</option>
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
            <Label htmlFor="suggestion-details">
              {t("suggestions.detailsLabel")}
            </Label>
            <textarea
              id="suggestion-details"
              name="details"
              rows={5}
              className={cn(
                "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
              )}
            />
            <FieldError message={state.fieldErrors?.details} />
          </div>

          <div className="space-y-2">
            <Label>{t("suggestions.attachments")}</Label>
            <MultiImageDropzone
              name="images"
              invalid={Boolean(state.fieldErrors?.images)}
              texts={{
                hint: t("suggestions.attachmentsHint"),
                types: t("suggestions.attachmentsTypes"),
                remove: t("suggestions.removeImage"),
              }}
            />
            <FieldError message={state.fieldErrors?.images} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("suggestions.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending ? t("suggestions.submitting") : t("suggestions.submit")}
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
