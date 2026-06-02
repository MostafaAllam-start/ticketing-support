"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  assignTicketAction,
  createTicketAction,
  deleteTicketAction,
  updateTicketAction,
  type TicketActionState,
} from "../ticket-actions";

export type EngineerOption = { id: number; name: string; username: string };
export type TicketItem = {
  id: number;
  title: string;
  description: string;
  status: "open" | "in_progress" | "closed";
  assigneeIds: number[];
};

const STATUSES = ["open", "in_progress", "closed"] as const;

const controlClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";
const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

// Reusable checkbox list of engineers. `selected` pre-checks current assignees.
function EngineerCheckboxes({
  engineers,
  selected = [],
}: {
  engineers: EngineerOption[];
  selected?: number[];
}) {
  const t = useTranslations("Dashboard");

  if (engineers.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        {t("tickets.noEngineers")}
      </p>
    );
  }

  return (
    <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-2">
      {engineers.map((engineer) => (
        <label
          key={engineer.id}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
        >
          <input
            type="checkbox"
            name="assigneeIds"
            value={engineer.id}
            defaultChecked={selected.includes(engineer.id)}
            className="size-4 accent-primary"
          />
          <span className="font-medium">{engineer.name}</span>
          <span className="text-xs text-muted-foreground">
            @{engineer.username}
          </span>
        </label>
      ))}
    </div>
  );
}

function TicketFormDialog({
  mode,
  ticket,
  engineers,
  open,
  onOpenChange,
}: {
  mode: "add" | "edit";
  ticket?: TicketItem;
  engineers: EngineerOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const action = mode === "add" ? createTicketAction : updateTicketAction;
  const [state, formAction, pending] = useActionState<
    TicketActionState,
    FormData
  >(action, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(
        mode === "add" ? t("tickets.toast.created") : t("tickets.toast.updated"),
      );
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, mode, t, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} className="grid gap-4">
          {mode === "edit" && ticket && (
            <input type="hidden" name="id" value={ticket.id} />
          )}
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? t("tickets.form.addTitle")
                : t("tickets.form.editTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("tickets.form.formDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="tk-title">{t("tickets.form.subject")}</Label>
            <Input
              id="tk-title"
              name="title"
              defaultValue={ticket?.title}
              placeholder={t("tickets.form.subjectPlaceholder")}
              aria-invalid={Boolean(state.fieldErrors?.title)}
              required
            />
            <FieldError message={state.fieldErrors?.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tk-description">{t("tickets.form.descLabel")}</Label>
            <textarea
              id="tk-description"
              name="description"
              rows={4}
              defaultValue={ticket?.description}
              placeholder={t("tickets.form.descPlaceholder")}
              aria-invalid={Boolean(state.fieldErrors?.description)}
              required
              className={cn(textareaClass)}
            />
            <FieldError message={state.fieldErrors?.description} />
          </div>

          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="tk-status">{t("tickets.form.status")}</Label>
              <select
                id="tk-status"
                name="status"
                defaultValue={ticket?.status ?? "open"}
                className={cn(controlClass)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "add" && (
            <div className="space-y-2">
              <Label>{t("tickets.form.assignees")}</Label>
              <EngineerCheckboxes engineers={engineers} />
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("tickets.form.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending ? t("tickets.form.saving") : t("tickets.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignTicketDialog({
  ticket,
  engineers,
  open,
  onOpenChange,
}: {
  ticket: TicketItem;
  engineers: EngineerOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const [state, formAction, pending] = useActionState<
    TicketActionState,
    FormData
  >(assignTicketAction, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(t("tickets.toast.assigned"));
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={ticket.id} />
          <DialogHeader>
            <DialogTitle>{t("tickets.assignDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("tickets.assignDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <EngineerCheckboxes
            engineers={engineers}
            selected={ticket.assigneeIds}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("tickets.assignDialog.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending
                ? t("tickets.assignDialog.saving")
                : t("tickets.assignDialog.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTicketDialog({
  ticket,
  open,
  onOpenChange,
}: {
  ticket: TicketItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const [state, formAction, pending] = useActionState<
    TicketActionState,
    FormData
  >(deleteTicketAction, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(t("tickets.toast.deleted"));
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={ticket.id} />
          <DialogHeader>
            <DialogTitle>{t("tickets.deleteConfirm.title")}</DialogTitle>
            <DialogDescription>
              {t("tickets.deleteConfirm.description", { title: ticket.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("tickets.deleteConfirm.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending
                ? t("tickets.deleteConfirm.deleting")
                : t("tickets.deleteConfirm.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddTicketButton({
  engineers,
}: {
  engineers: EngineerOption[];
}) {
  const t = useTranslations("Dashboard");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        {t("tickets.new")}
      </Button>
      <TicketFormDialog
        mode="add"
        engineers={engineers}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function TicketRowActions({
  ticket,
  engineers,
}: {
  ticket: TicketItem;
  engineers: EngineerOption[];
}) {
  const t = useTranslations("Dashboard");
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
            <span className="sr-only">{t("tickets.actions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            {t("tickets.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setAssignOpen(true)}>
            <UserPlus />
            {t("tickets.assign")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            {t("tickets.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TicketFormDialog
        mode="edit"
        ticket={ticket}
        engineers={engineers}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <AssignTicketDialog
        ticket={ticket}
        engineers={engineers}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />
      <DeleteTicketDialog
        ticket={ticket}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
