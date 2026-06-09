"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn, keepInputOnError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { closeTicketAction, reopenTicketAction } from "../ticket-actions";

// Review controls for admins/managers on the ticket detail page: a "Close" flow
// (with a required closing comment) for open tickets, and "Reopen" for closed
// ones.
export function TicketReviewActions({
  ticketId,
  status,
}: {
  ticketId: number;
  status: string;
}) {
  return status === "closed" ? (
    <ReopenButton ticketId={ticketId} />
  ) : (
    <CloseDialog ticketId={ticketId} />
  );
}

const textareaClass =
  "w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30";

function CloseDialog({ ticketId }: { ticketId: number }) {
  const t = useTranslations("Tickets");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(closeTicketAction, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(t("review.closed"));
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CheckCircle2 />
          {t("review.close")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} onReset={keepInputOnError(state)} className="grid gap-4">
          <input type="hidden" name="id" value={ticketId} />
          <DialogHeader>
            <DialogTitle>{t("review.closeTitle")}</DialogTitle>
            <DialogDescription>{t("review.closeDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="close-comment">{t("review.commentLabel")}</Label>
            <textarea
              id="close-comment"
              name="comment"
              rows={4}
              required
              placeholder={t("review.commentPlaceholder")}
              aria-invalid={Boolean(state.fieldErrors?.comment)}
              className={cn(textareaClass)}
            />
            {state.fieldErrors?.comment && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.comment}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("review.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending ? t("review.closing") : t("review.confirmClose")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReopenButton({ ticketId }: { ticketId: number }) {
  const t = useTranslations("Tickets");
  const [state, action, pending] = useActionState(reopenTicketAction, {});

  useEffect(() => {
    if (state.ok) toast.success(t("review.reopened"));
    else if (state.error) toast.error(state.error);
  }, [state, t]);

  return (
    <form action={action} onReset={keepInputOnError(state)}>
      <input type="hidden" name="id" value={ticketId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
        {t("review.reopen")}
      </Button>
    </form>
  );
}
