"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, MoreHorizontal, SquareArrowOutUpRight, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { keepInputOnError } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteSuggestionAction,
  type SuggestionState,
} from "../../suggestion-actions";

export type SuggestionItem = {
  id: number;
  title: string;
};

function DeleteSuggestionDialog({
  suggestion,
  open,
  onOpenChange,
}: {
  suggestion: SuggestionItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const [state, formAction, pending] = useActionState<SuggestionState, FormData>(
    deleteSuggestionAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(t("suggestions.toast.deleted"));
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} onReset={keepInputOnError(state)} className="grid gap-4">
          <input type="hidden" name="id" value={suggestion.id} />
          <DialogHeader>
            <DialogTitle>{t("suggestions.deleteConfirm.title")}</DialogTitle>
            <DialogDescription>
              {t("suggestions.deleteConfirm.description", {
                title: suggestion.title,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("suggestions.deleteConfirm.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending
                ? t("suggestions.deleteConfirm.deleting")
                : t("suggestions.deleteConfirm.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SuggestionRowActions({
  suggestion,
}: {
  suggestion: SuggestionItem;
}) {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
            <span className="sr-only">{t("suggestions.actions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() =>
              router.push(`/dashboard/suggestions/${suggestion.id}`)
            }
          >
            <SquareArrowOutUpRight />
            {t("suggestions.open")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            {t("suggestions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteSuggestionDialog
        suggestion={suggestion}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
