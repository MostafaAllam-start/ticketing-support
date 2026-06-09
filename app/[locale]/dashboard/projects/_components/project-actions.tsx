"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import {
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn, keepInputOnError } from "@/lib/utils";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableRow } from "@/components/ui/table";
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
  addProjectMemberAction,
  createProjectAction,
  deleteProjectAction,
  removeProjectMemberAction,
  updateProjectAction,
  type ProjectActionState,
} from "../../projects-actions";

export type Option = { id: number; name: string };
export type ProjectMember = {
  userId: number;
  userName: string;
  roleId: number;
  roleName: string;
};
export type ProjectItem = {
  id: number;
  name: string;
  location: string;
  companyId: number;
  managerId: number | null;
  members: ProjectMember[];
};

const selectClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function ProjectFormDialog({
  mode,
  project,
  companies,
  users,
  open,
  onOpenChange,
}: {
  mode: "add" | "edit";
  project?: ProjectItem;
  companies: Option[];
  users: Option[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const action = mode === "add" ? createProjectAction : updateProjectAction;
  const [state, formAction, pending] = useActionState<
    ProjectActionState,
    FormData
  >(action, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(
        mode === "add"
          ? t("projects.toast.created")
          : t("projects.toast.updated"),
      );
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, mode, t, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} onReset={keepInputOnError(state)} className="grid gap-4">
          {mode === "edit" && project && (
            <input type="hidden" name="id" value={project.id} />
          )}
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? t("projects.form.addTitle")
                : t("projects.form.editTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("projects.form.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="project-name">{t("projects.form.name")}</Label>
            <Input
              id="project-name"
              name="name"
              defaultValue={project?.name}
              aria-invalid={Boolean(state.fieldErrors?.name)}
              required
            />
            <FieldError message={state.fieldErrors?.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-location">
              {t("projects.form.location")}
            </Label>
            <Input
              id="project-location"
              name="location"
              defaultValue={project?.location}
              aria-invalid={Boolean(state.fieldErrors?.location)}
              required
            />
            <FieldError message={state.fieldErrors?.location} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-company">{t("projects.form.company")}</Label>
            <select
              id="project-company"
              name="companyId"
              defaultValue={project?.companyId ?? ""}
              required
              className={cn(selectClass)}
            >
              <option value="" disabled>
                {t("projects.form.companyPlaceholder")}
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.companyId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-manager">{t("projects.form.manager")}</Label>
            <select
              id="project-manager"
              name="managerId"
              defaultValue={project?.managerId ?? ""}
              className={cn(selectClass)}
            >
              <option value="">{t("projects.form.noManager")}</option>
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
                {t("projects.form.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending ? t("projects.form.saving") : t("projects.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MembersDialog({
  project,
  users,
  roles,
  open,
  onOpenChange,
}: {
  project: ProjectItem;
  users: Option[];
  roles: Option[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const [addState, addAction, addPending] = useActionState<
    ProjectActionState,
    FormData
  >(addProjectMemberAction, {});
  const [removeState, removeAction] = useActionState<
    ProjectActionState,
    FormData
  >(removeProjectMemberAction, {});

  useEffect(() => {
    if (addState.ok) toast.success(t("projects.members.added"));
    else if (addState.error) toast.error(addState.error);
  }, [addState, t]);

  useEffect(() => {
    if (removeState.ok) toast.success(t("projects.members.removed"));
    else if (removeState.error) toast.error(removeState.error);
  }, [removeState, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("projects.members.title", { name: project.name })}
          </DialogTitle>
          <DialogDescription>
            {t("projects.members.description")}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {project.members.length === 0 ? (
            <li className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              {t("projects.members.empty")}
            </li>
          ) : (
            project.members.map((member) => (
              <li
                key={member.userId}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <span>
                  {member.userName}
                  <span className="ms-2 text-xs text-muted-foreground">
                    {member.roleName}
                  </span>
                </span>
                <form action={removeAction} onReset={keepInputOnError(removeState)}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="userId" value={member.userId} />
                  <Button type="submit" variant="ghost" size="icon-sm">
                    <Trash2 className="text-destructive" />
                    <span className="sr-only">
                      {t("projects.members.remove")}
                    </span>
                  </Button>
                </form>
              </li>
            ))
          )}
        </ul>

        <form action={addAction} onReset={keepInputOnError(addState)} className="grid gap-3 border-t pt-4">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-user">{t("projects.members.user")}</Label>
              <select
                id="member-user"
                name="userId"
                defaultValue=""
                required
                className={cn(selectClass)}
              >
                <option value="" disabled>
                  {t("projects.members.userPlaceholder")}
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">{t("projects.members.role")}</Label>
              <select
                id="member-role"
                name="roleId"
                defaultValue=""
                required
                className={cn(selectClass)}
              >
                <option value="" disabled>
                  {t("projects.members.rolePlaceholder")}
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={addPending}>
              {addPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Plus />
              )}
              {t("projects.members.add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: ProjectItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const [state, formAction, pending] = useActionState<
    ProjectActionState,
    FormData
  >(deleteProjectAction, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(t("projects.toast.deleted"));
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} onReset={keepInputOnError(state)} className="grid gap-4">
          <input type="hidden" name="id" value={project.id} />
          <DialogHeader>
            <DialogTitle>{t("projects.deleteConfirm.title")}</DialogTitle>
            <DialogDescription>
              {t("projects.deleteConfirm.description", { name: project.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("projects.deleteConfirm.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending
                ? t("projects.deleteConfirm.deleting")
                : t("projects.deleteConfirm.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddProjectButton({
  companies,
  users,
}: {
  companies: Option[];
  users: Option[];
}) {
  const t = useTranslations("Dashboard");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        {t("projects.add")}
      </Button>
      <ProjectFormDialog
        mode="add"
        companies={companies}
        users={users}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

// A table row that navigates to the project's details page when clicked. The
// actions cell stops propagation so its menu/dialogs don't trigger navigation.
export function ClickableProjectRow({
  id,
  children,
}: {
  id: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const href = `/dashboard/projects/${id}`;

  return (
    <TableRow
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
      className="cursor-pointer"
    >
      {children}
    </TableRow>
  );
}

export function ProjectRowActions({
  project,
  companies,
  users,
  roles,
}: {
  project: ProjectItem;
  companies: Option[];
  users: Option[];
  roles: Option[];
}) {
  const t = useTranslations("Dashboard");
  const [editOpen, setEditOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    // Keep clicks/keys inside the menu from bubbling up to the clickable row.
    <span
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
            <span className="sr-only">{t("projects.actions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/projects/${project.id}`}>
              <Eye />
              {t("projects.details")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            {t("projects.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMembersOpen(true)}>
            <Users />
            {t("projects.manageMembers")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            {t("projects.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectFormDialog
        mode="edit"
        project={project}
        companies={companies}
        users={users}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <MembersDialog
        project={project}
        users={users}
        roles={roles}
        open={membersOpen}
        onOpenChange={setMembersOpen}
      />
      <DeleteProjectDialog
        project={project}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </span>
  );
}
