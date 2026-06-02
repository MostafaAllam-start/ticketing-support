"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Ban,
  CircleCheck,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
} from "lucide-react";
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
  createUserAction,
  setUserDisabledAction,
  updateUserAction,
  type ActionState,
} from "../actions";

export type UserItem = {
  id: number;
  name: string;
  username: string;
  email: string;
  jobTitle: string | null;
  role: string;
  image: string | null;
  isDisabled: boolean;
};

const controlClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function UserFormDialog({
  mode,
  user,
  roles,
  open,
  onOpenChange,
}: {
  mode: "add" | "edit";
  user?: UserItem;
  roles: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const action = mode === "add" ? createUserAction : updateUserAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(
        mode === "add" ? t("users.toast.created") : t("users.toast.updated"),
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
          {mode === "edit" && user && (
            <input type="hidden" name="id" value={user.id} />
          )}
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? t("users.form.addTitle")
                : t("users.form.editTitle")}
            </DialogTitle>
            <DialogDescription>{t("users.form.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="user-name">{t("users.form.name")}</Label>
            <Input
              id="user-name"
              name="name"
              defaultValue={user?.name}
              aria-invalid={Boolean(state.fieldErrors?.name)}
              required
            />
            <FieldError message={state.fieldErrors?.name} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-username">{t("users.form.username")}</Label>
              <Input
                id="user-username"
                name="username"
                defaultValue={user?.username}
                aria-invalid={Boolean(state.fieldErrors?.username)}
                required
              />
              <FieldError message={state.fieldErrors?.username} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">{t("users.form.email")}</Label>
              <Input
                id="user-email"
                name="email"
                type="email"
                defaultValue={user?.email}
                aria-invalid={Boolean(state.fieldErrors?.email)}
                required
              />
              <FieldError message={state.fieldErrors?.email} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-role">{t("users.form.role")}</Label>
              <select
                id="user-role"
                name="role"
                defaultValue={user?.role ?? "user"}
                className={cn(controlClass)}
                aria-invalid={Boolean(state.fieldErrors?.role)}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <FieldError message={state.fieldErrors?.role} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-jobTitle">{t("users.form.jobTitle")}</Label>
              <Input
                id="user-jobTitle"
                name="jobTitle"
                defaultValue={user?.jobTitle ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-image">{t("users.form.image")}</Label>
            {mode === "edit" && user && (
              <input type="hidden" name="currentImage" value={user.image ?? ""} />
            )}
            <ImageDropzone
              id="user-image"
              name="imageFile"
              defaultPreview={user?.image ?? undefined}
              invalid={Boolean(state.fieldErrors?.image)}
              texts={{
                hint: t("users.form.imageHint"),
                types: t("users.form.imageTypes"),
                remove: t("users.form.imageRemove"),
              }}
            />
            <FieldError message={state.fieldErrors?.image} />
          </div>

          {/* Create uses a default password from the environment, so the field
              only appears when editing (blank = keep the current password). */}
          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="user-password">{t("users.form.password")}</Label>
              <Input
                id="user-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={Boolean(state.fieldErrors?.password)}
              />
              <FieldError message={state.fieldErrors?.password} />
              <p className="text-xs text-muted-foreground">
                {t("users.form.passwordHint")}
              </p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("users.form.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending ? t("users.form.saving") : t("users.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToggleDisabledDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    setUserDisabledAction,
    {},
  );
  // The dialog toggles to the opposite of the user's current state.
  const willDisable = !user.isDisabled;

  useEffect(() => {
    if (state.ok) {
      toast.success(
        willDisable ? t("users.toast.disabled") : t("users.toast.enabled"),
      );
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, willDisable, t, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="disabled" value={String(willDisable)} />
          <DialogHeader>
            <DialogTitle>
              {willDisable
                ? t("users.disableConfirm.disableTitle")
                : t("users.disableConfirm.enableTitle")}
            </DialogTitle>
            <DialogDescription>
              {willDisable
                ? t("users.disableConfirm.disableDescription", {
                    name: user.name,
                  })
                : t("users.disableConfirm.enableDescription", {
                    name: user.name,
                  })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("users.disableConfirm.cancel")}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant={willDisable ? "destructive" : "default"}
              disabled={pending}
            >
              {pending && <Loader2 className="animate-spin" />}
              {willDisable
                ? t("users.disableConfirm.disable")
                : t("users.disableConfirm.enable")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddUserButton({ roles }: { roles: string[] }) {
  const t = useTranslations("Dashboard");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        {t("users.add")}
      </Button>
      <UserFormDialog
        mode="add"
        roles={roles}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function UserRowActions({
  user,
  roles,
  isSelf,
}: {
  user: UserItem;
  roles: string[];
  isSelf: boolean;
}) {
  const t = useTranslations("Dashboard");
  const [editOpen, setEditOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
            <span className="sr-only">{t("users.actions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            {t("users.edit")}
          </DropdownMenuItem>
          {user.isDisabled ? (
            <DropdownMenuItem onSelect={() => setToggleOpen(true)}>
              <CircleCheck />
              {t("users.enable")}
            </DropdownMenuItem>
          ) : (
            // An admin can't disable their own account; hide the action for self.
            <DropdownMenuItem
              variant="destructive"
              disabled={isSelf}
              onSelect={() => setToggleOpen(true)}
            >
              <Ban />
              {t("users.disable")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserFormDialog
        mode="edit"
        user={user}
        roles={roles}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ToggleDisabledDialog
        user={user}
        open={toggleOpen}
        onOpenChange={setToggleOpen}
      />
    </>
  );
}
