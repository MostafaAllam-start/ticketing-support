"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageDropzone } from "@/components/ui/image-dropzone";
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
  createTeamMemberAction,
  deleteTeamMemberAction,
  updateTeamMemberAction,
  type ActionState,
} from "../actions";

export type UserOption = { id: number; name: string };
export type TeamMemberItem = {
  id: number;
  name: string;
  position: string;
  image: string;
  userId: number | null;
};

const controlClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function TeamMemberFormDialog({
  mode,
  member,
  users,
  open,
  onOpenChange,
}: {
  mode: "add" | "edit";
  member?: TeamMemberItem;
  users: UserOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const action = mode === "add" ? createTeamMemberAction : updateTeamMemberAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(
        mode === "add"
          ? t("teamMembers.toast.created")
          : t("teamMembers.toast.updated"),
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
          {mode === "edit" && member && (
            <input type="hidden" name="id" value={member.id} />
          )}
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? t("teamMembers.form.addTitle")
                : t("teamMembers.form.editTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("teamMembers.form.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="tm-name">{t("teamMembers.form.name")}</Label>
            <Input
              id="tm-name"
              name="name"
              defaultValue={member?.name}
              aria-invalid={Boolean(state.fieldErrors?.name)}
              required
            />
            <FieldError message={state.fieldErrors?.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tm-position">{t("teamMembers.form.position")}</Label>
            <Input
              id="tm-position"
              name="position"
              defaultValue={member?.position}
              aria-invalid={Boolean(state.fieldErrors?.position)}
              required
            />
            <FieldError message={state.fieldErrors?.position} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tm-image">{t("teamMembers.form.image")}</Label>
            {mode === "edit" && member && (
              <input type="hidden" name="currentImage" value={member.image} />
            )}
            <ImageDropzone
              id="tm-image"
              name="imageFile"
              defaultPreview={member?.image}
              invalid={Boolean(state.fieldErrors?.image)}
              texts={{
                hint: t("teamMembers.form.imageHint"),
                types: t("teamMembers.form.imageTypes"),
                remove: t("teamMembers.form.imageRemove"),
              }}
            />
            <FieldError message={state.fieldErrors?.image} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tm-user">{t("teamMembers.form.user")}</Label>
            <select
              id="tm-user"
              name="userId"
              defaultValue={member?.userId != null ? String(member.userId) : ""}
              className={cn(controlClass)}
            >
              <option value="">{t("teamMembers.form.userNone")}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("teamMembers.form.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending ? t("teamMembers.form.saving") : t("teamMembers.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTeamMemberDialog({
  member,
  open,
  onOpenChange,
}: {
  member: TeamMemberItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    deleteTeamMemberAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(t("teamMembers.toast.deleted"));
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={member.id} />
          <DialogHeader>
            <DialogTitle>{t("teamMembers.deleteConfirm.title")}</DialogTitle>
            <DialogDescription>
              {t("teamMembers.deleteConfirm.description", { name: member.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("teamMembers.deleteConfirm.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending
                ? t("teamMembers.deleteConfirm.deleting")
                : t("teamMembers.deleteConfirm.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddTeamMemberButton({ users }: { users: UserOption[] }) {
  const t = useTranslations("Dashboard");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        {t("teamMembers.add")}
      </Button>
      <TeamMemberFormDialog
        mode="add"
        users={users}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function TeamMemberRowActions({
  member,
  users,
}: {
  member: TeamMemberItem;
  users: UserOption[];
}) {
  const t = useTranslations("Dashboard");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            {t("teamMembers.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 />
            {t("teamMembers.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TeamMemberFormDialog
        mode="edit"
        member={member}
        users={users}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteTeamMemberDialog
        member={member}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
