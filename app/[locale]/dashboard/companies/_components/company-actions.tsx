"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
import { keepInputOnError } from "@/lib/utils";
import { isSeededCompany } from "@/lib/companies";
import {
  createCompanyAction,
  deleteCompanyAction,
  updateCompanyAction,
  type ActionState,
} from "../actions";

export type CompanyItem = {
  id: number;
  name: string;
  logo: string;
  websiteUrl: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function CompanyFormDialog({
  mode,
  company,
  open,
  onOpenChange,
}: {
  mode: "add" | "edit";
  company?: CompanyItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const action = mode === "add" ? createCompanyAction : updateCompanyAction;
  // Seeded companies (ECM/CTC) keep their name; only logo + website are editable.
  const nameLocked = mode === "edit" && isSeededCompany(company?.name);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(
        mode === "add"
          ? t("companies.toast.created")
          : t("companies.toast.updated"),
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
          {mode === "edit" && company && (
            <input type="hidden" name="id" value={company.id} />
          )}
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? t("companies.form.addTitle")
                : t("companies.form.editTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("companies.form.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="company-name">{t("companies.form.name")}</Label>
            <Input
              id="company-name"
              name="name"
              defaultValue={company?.name}
              aria-invalid={Boolean(state.fieldErrors?.name)}
              readOnly={nameLocked}
              className={nameLocked ? "bg-muted text-muted-foreground" : undefined}
              required
            />
            {nameLocked ? (
              <p className="text-xs text-muted-foreground">
                {t("companies.form.nameLocked")}
              </p>
            ) : (
              <FieldError message={state.fieldErrors?.name} />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-logo">{t("companies.form.logo")}</Label>
            {mode === "edit" && company && (
              <input type="hidden" name="currentLogo" value={company.logo} />
            )}
            <ImageDropzone
              id="company-logo"
              name="logoFile"
              defaultPreview={company?.logo}
              invalid={Boolean(state.fieldErrors?.logo)}
              texts={{
                hint: t("companies.form.logoHint"),
                types: t("companies.form.logoTypes"),
                remove: t("companies.form.logoRemove"),
              }}
            />
            <FieldError message={state.fieldErrors?.logo} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-website">
              {t("companies.form.website")}
            </Label>
            <Input
              id="company-website"
              name="websiteUrl"
              defaultValue={company?.websiteUrl}
              placeholder="https://…"
              aria-invalid={Boolean(state.fieldErrors?.websiteUrl)}
              required
            />
            <FieldError message={state.fieldErrors?.websiteUrl} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("companies.form.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending ? t("companies.form.saving") : t("companies.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCompanyDialog({
  company,
  open,
  onOpenChange,
}: {
  company: CompanyItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    deleteCompanyAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(t("companies.toast.deleted"));
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} onReset={keepInputOnError(state)} className="grid gap-4">
          <input type="hidden" name="id" value={company.id} />
          <DialogHeader>
            <DialogTitle>{t("companies.deleteConfirm.title")}</DialogTitle>
            <DialogDescription>
              {t("companies.deleteConfirm.description", { name: company.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("companies.deleteConfirm.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending
                ? t("companies.deleteConfirm.deleting")
                : t("companies.deleteConfirm.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddCompanyButton() {
  const t = useTranslations("Dashboard");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        {t("companies.add")}
      </Button>
      <CompanyFormDialog mode="add" open={open} onOpenChange={setOpen} />
    </>
  );
}

export function CompanyRowActions({ company }: { company: CompanyItem }) {
  const t = useTranslations("Dashboard");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Seeded companies (ECM/CTC) can be edited but never deleted.
  const deletable = !isSeededCompany(company.name);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
            <span className="sr-only">{t("companies.actions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            {t("companies.edit")}
          </DropdownMenuItem>
          {deletable && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 />
              {t("companies.delete")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CompanyFormDialog
        mode="edit"
        company={company}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      {deletable && (
        <DeleteCompanyDialog
          company={company}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}
