"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addTeamMemberAction,
  removeTeamMemberAction,
  type ActionState,
} from "../actions";

export type UserOption = { id: number; name: string };

const controlClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

function AddTeamMemberDialog({
  candidates,
  open,
  onOpenChange,
}: {
  candidates: UserOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addTeamMemberAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(t("teamMembers.toast.added"));
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} onReset={keepInputOnError(state)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("teamMembers.form.addTitle")}</DialogTitle>
            <DialogDescription>
              {t("teamMembers.form.description")}
            </DialogDescription>
          </DialogHeader>

          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("teamMembers.form.noCandidates")}
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="tm-user">{t("teamMembers.form.user")}</Label>
              <select
                id="tm-user"
                name="userId"
                defaultValue=""
                required
                className={cn(controlClass)}
              >
                <option value="" disabled>
                  {t("teamMembers.form.userPlaceholder")}
                </option>
                {candidates.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("teamMembers.form.cancel")}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={pending || candidates.length === 0}
            >
              {pending && <Loader2 className="animate-spin" />}
              {pending ? t("teamMembers.form.saving") : t("teamMembers.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveTeamMemberDialog({
  member,
  open,
  onOpenChange,
}: {
  member: UserOption;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    removeTeamMemberAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(t("teamMembers.toast.removed"));
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} onReset={keepInputOnError(state)} className="grid gap-4">
          <input type="hidden" name="userId" value={member.id} />
          <DialogHeader>
            <DialogTitle>{t("teamMembers.removeConfirm.title")}</DialogTitle>
            <DialogDescription>
              {t("teamMembers.removeConfirm.description", { name: member.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("teamMembers.removeConfirm.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending
                ? t("teamMembers.removeConfirm.removing")
                : t("teamMembers.removeConfirm.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddTeamMemberButton({
  candidates,
}: {
  candidates: UserOption[];
}) {
  const t = useTranslations("Dashboard");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        {t("teamMembers.add")}
      </Button>
      <AddTeamMemberDialog
        candidates={candidates}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function TeamMemberRowActions({ member }: { member: UserOption }) {
  const t = useTranslations("Dashboard");
  const [removeOpen, setRemoveOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
            <span className="sr-only">{t("teamMembers.actions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setRemoveOpen(true)}
          >
            <Trash2 />
            {t("teamMembers.remove")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RemoveTeamMemberDialog
        member={member}
        open={removeOpen}
        onOpenChange={setRemoveOpen}
      />
    </>
  );
}
