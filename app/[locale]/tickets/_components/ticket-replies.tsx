"use client";

import type { ComponentType } from "react";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Loader2,
  Paperclip,
  Pencil,
  Reply as ReplyIcon,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn, keepInputOnError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { ReplyAttachment } from "@/lib/reply-attachments";
import type { ReplyWithAuthor } from "@/services";
import {
  deleteTicketReplyAction,
  postTicketReplyAction,
  updateTicketReplyAction,
  type ReportState,
} from "../actions";

export type EntityReplyActions = {
  post: (
    prev: ReportState,
    formData: FormData,
  ) => Promise<ReportState>;
  update: (
    prev: ReportState,
    formData: FormData,
  ) => Promise<ReportState>;
  delete: (
    prev: ReportState,
    formData: FormData,
  ) => Promise<ReportState>;
};

export type EntityReplyForm = {
  entityField: "ticketId" | "entityId";
  entityId: number;
  extraFields?: Record<string, number>;
};

const defaultActions: EntityReplyActions = {
  post: postTicketReplyAction,
  update: updateTicketReplyAction,
  delete: deleteTicketReplyAction,
};

// Up to two initials from a name, for the avatar fallback.
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10);
}

// Renders a ticket's replies as a two-party conversation (comments + threaded
// replies). Each message shows its author (image, name, position), is aligned to
// the end for the viewer's own messages and to the start for the other party, and
// carries reply/edit/delete actions — edit and delete only for the author or an
// admin. A composer at the bottom starts a new comment.
export function TicketReplies({
  ticketId,
  entityForm,
  actions = defaultActions,
  currentUserId,
  currentUserRole,
  replies,
  attachmentsByReply,
  canReply = true,
  compact = false,
}: {
  ticketId?: number;
  entityForm?: EntityReplyForm;
  actions?: EntityReplyActions;
  currentUserId: number;
  currentUserRole: string;
  replies: ReplyWithAuthor[];
  attachmentsByReply: Record<number, ReplyAttachment[]>;
  canReply?: boolean;
  compact?: boolean;
}) {
  const form: EntityReplyForm =
    entityForm ??
    ({
      entityField: "ticketId",
      entityId: ticketId!,
    } as EntityReplyForm);

  const t = useTranslations("Tickets");

  // The service returns replies oldest-first. Split into top-level comments and
  // their direct children (the thread is kept one level deep).
  const topLevel = replies.filter((reply) => reply.parentReplyId == null);
  const childrenByParent = new Map<number, ReplyWithAuthor[]>();
  for (const reply of replies) {
    if (reply.parentReplyId != null) {
      const siblings = childrenByParent.get(reply.parentReplyId) ?? [];
      siblings.push(reply);
      childrenByParent.set(reply.parentReplyId, siblings);
    }
  }

  return (
    <section className={compact ? "mt-4" : "mt-8"}>
      {!compact && (
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          {t("replies.title")}
          {replies.length > 0 && (
            <span className="ms-2 text-sm font-normal text-muted-foreground">
              ({replies.length})
            </span>
          )}
        </h2>
      )}

      {topLevel.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("replies.empty")}
        </div>
      ) : (
        <ol className="space-y-6">
          {topLevel.map((reply) => (
            <li key={reply.id}>
              <ReplyNode
                reply={reply}
                childrenByParent={childrenByParent}
                entityForm={form}
                actions={actions}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                attachmentsByReply={attachmentsByReply}
                canReply={canReply}
              />
            </li>
          ))}
        </ol>
      )}

      {canReply && (
        <div className={compact ? "mt-4 border-t pt-4" : "mt-6 border-t pt-6"}>
          <Composer
            entityForm={form}
            actions={actions}
            mode="comment"
          />
        </div>
      )}
    </section>
  );
}

// One node of the conversation tree: the message, then (recursively) its replies
// indented one level deeper with a thread connector line, so a reply-to-a-reply
// nests under it rather than flattening to the top comment.
function ReplyNode({
  reply,
  childrenByParent,
  entityForm,
  actions,
  currentUserId,
  currentUserRole,
  attachmentsByReply,
  canReply,
}: {
  reply: ReplyWithAuthor;
  childrenByParent: Map<number, ReplyWithAuthor[]>;
  entityForm: EntityReplyForm;
  actions: EntityReplyActions;
  currentUserId: number;
  currentUserRole: string;
  attachmentsByReply: Record<number, ReplyAttachment[]>;
  canReply: boolean;
}) {
  const children = childrenByParent.get(reply.id) ?? [];

  return (
    <div className="space-y-4">
      <MessageItem
        reply={reply}
        entityForm={entityForm}
        actions={actions}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        attachments={attachmentsByReply[reply.id] ?? []}
        canReply={canReply}
      />

      {children.length > 0 && (
        // Nested replies indent + draw their connector line on the left in LTR,
        // and on the right in RTL.
        <ol className="space-y-4 border-border ltr:mr-5 ltr:border-r-2 ltr:pl-6 rtl:ml-5 rtl:border-l-2 rtl:pl-6">

          {children.map((child) => (
            <li key={child.id}>
              <ReplyNode
                reply={child}
                childrenByParent={childrenByParent}
                entityForm={entityForm}
                actions={actions}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                attachmentsByReply={attachmentsByReply}
                canReply={canReply}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// A single attributed chat message with its reply/edit/delete actions. Manages
// its own mode so only one inline form (reply or edit) is open at a time.
function MessageItem({
  reply,
  entityForm,
  actions,
  currentUserId,
  currentUserRole,
  attachments,
  canReply,
}: {
  reply: ReplyWithAuthor;
  entityForm: EntityReplyForm;
  actions: EntityReplyActions;
  currentUserId: number;
  currentUserRole: string;
  attachments: ReplyAttachment[];
  canReply: boolean;
}) {
  const t = useTranslations("Tickets");
  const mine = reply.user.id === currentUserId;
  const canModify =
    currentUserRole === "admin" || (mine && canReply);
  const [mode, setMode] = useState<"idle" | "reply" | "edit">("idle");
  const toIdle = useCallback(() => setMode("idle"), []);
  const expanded = mode !== "idle";

  // A reply nests directly under the message it answers, forming a hierarchy.
  const threadParentId = reply.id;

  // Position: the author's job title when set, else a label for their system role
  // (so reporters without a job title still read sensibly).
  const roleKey = `replies.roles.${reply.user.role.name}`;
  const position =
    reply.user.jobTitle ??
    (t.has(roleKey) ? t(roleKey) : reply.user.role.name);

  return (
    <div className={cn("flex gap-3", mine && "flex-row-reverse")}>
      <Avatar size="sm" className="mt-0.5">
        {reply.user.image && <AvatarImage src={reply.user.image} alt="" />}
        <AvatarFallback>{initials(reply.user.name)}</AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex min-w-0 flex-col gap-1",
          expanded ? "w-full" : "max-w-[85%]",
          mine && !expanded && "items-end",
        )}
      >
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground",
            mine && "flex-row-reverse",
          )}
        >
          <span className="font-medium text-foreground">{reply.user.name}</span>
          <span aria-hidden>·</span>
          <span>{position}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{formatDate(reply.createdAt)}</span>
        </div>

        {mode === "edit" ? (
          <Composer
            entityForm={entityForm}
            actions={actions}
            mode="edit"
            replyId={reply.id}
            initialValue={reply.description}
            autoFocus
            onDone={toIdle}
            onCancel={toIdle}
          />
        ) : (
          <>
            <div
              className={cn(
                "inline-block rounded-2xl px-4 py-2 text-sm break-words whitespace-pre-wrap",
                mine
                  ? "rounded-se-sm bg-primary text-primary-foreground"
                  : "rounded-ss-sm bg-muted",
              )}
            >
              {reply.description}
            </div>

            {attachments.length > 0 && (
              <ul className={cn("flex flex-wrap gap-2", mine && "justify-end")}>
                {attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block size-20 overflow-hidden rounded-lg border transition-opacity hover:opacity-90"
                    >
                      <Image
                        src={attachment.url}
                        alt=""
                        width={80}
                        height={80}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {mode === "idle" && (
          <div className={cn("flex items-center gap-1", mine && "flex-row-reverse")}>
            {canReply && (
              <ActionButton
                icon={ReplyIcon}
                label={t("replies.reply")}
                onClick={() => setMode("reply")}
              />
            )}
            {canModify && (
              <ActionButton
                icon={Pencil}
                label={t("replies.edit")}
                onClick={() => setMode("edit")}
              />
            )}
            {canModify && (
              <DeleteReplyButton replyId={reply.id} deleteAction={actions.delete} />
            )}
          </div>
        )}

        {mode === "reply" && (
          <div className="w-full pt-1">
            <Composer
              entityForm={entityForm}
              actions={actions}
              mode="reply"
              parentReplyId={threadParentId}
              autoFocus
              onDone={toIdle}
              onCancel={toIdle}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// A compact, ghost action button used in the per-message action row.
function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
      onClick={onClick}
    >
      <Icon className="size-3.5" />
      {label}
    </Button>
  );
}

// Delete affordance: opens a confirmation dialog, then posts the delete action.
function DeleteReplyButton({
  replyId,
  deleteAction,
}: {
  replyId: number;
  deleteAction: EntityReplyActions["delete"];
}) {
  const t = useTranslations("Tickets");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAction, {});

  useEffect(() => {
    if (state.ok) setOpen(false);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
          {t("replies.delete")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} onReset={keepInputOnError(state)}>
          <input type="hidden" name="replyId" value={replyId} />
          <DialogHeader>
            <DialogTitle>{t("replies.deleteConfirm.title")}</DialogTitle>
            <DialogDescription>
              {t("replies.deleteConfirm.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("replies.deleteConfirm.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending
                ? t("replies.deleteConfirm.deleting")
                : t("replies.deleteConfirm.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// The message input, shared by the new-comment, reply, and edit flows. Posts
// through the matching server action; on success the page is revalidated (so the
// change streams in) and the form resets / closes.
function Composer({
  entityForm,
  actions,
  mode,
  parentReplyId,
  replyId,
  initialValue,
  autoFocus,
  onDone,
  onCancel,
}: {
  entityForm: EntityReplyForm;
  actions: EntityReplyActions;
  mode: "comment" | "reply" | "edit";
  parentReplyId?: number;
  replyId?: number;
  initialValue?: string;
  autoFocus?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("Tickets");
  const isEdit = mode === "edit";
  const [state, action, pending] = useActionState(
    isEdit ? actions.update : actions.post,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Image picking (new comments/replies only). The chosen files are mirrored into
  // a hidden <input type="file" name="images"> via a DataTransfer so they submit
  // with the form; previews are tracked for the thumbnail strip / removal.
  const MAX_FILES = 4;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  const revokePreviews = useCallback(() => {
    previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, []);

  // Revoke object URLs on unmount (e.g. the reply box closing).
  useEffect(() => revokePreviews, [revokePreviews]);

  const syncFiles = useCallback((next: { file: File; url: string }[]) => {
    const transfer = new DataTransfer();
    next.forEach((preview) => transfer.items.add(preview.file));
    if (fileInputRef.current) fileInputRef.current.files = transfer.files;
    setPreviews(next);
  }, []);

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const incoming = Array.from(list).filter((file) =>
        file.type.startsWith("image/"),
      );
      const next = [...previewsRef.current];
      for (const file of incoming) {
        if (next.length >= MAX_FILES) break;
        next.push({ file, url: URL.createObjectURL(file) });
      }
      syncFiles(next);
    },
    [syncFiles],
  );

  const removeFile = useCallback(
    (index: number) => {
      const target = previewsRef.current[index];
      if (target) URL.revokeObjectURL(target.url);
      syncFiles(previewsRef.current.filter((_, i) => i !== index));
    },
    [syncFiles],
  );

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      revokePreviews();
      setPreviews([]);
      onDone?.();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onDone, revokePreviews]);

  const placeholder =
    mode === "reply"
      ? t("replies.replyPlaceholder")
      : mode === "edit"
        ? t("replies.editPlaceholder")
        : t("replies.placeholder");

  return (
    <form ref={formRef} action={action} onReset={keepInputOnError(state)} className="w-full space-y-2">
      {isEdit ? (
        <input type="hidden" name="replyId" value={replyId} />
      ) : (
        <>
          <input
            type="hidden"
            name={entityForm.entityField}
            value={entityForm.entityId}
          />
          {entityForm.extraFields &&
            Object.entries(entityForm.extraFields).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
          {parentReplyId != null && (
            <input type="hidden" name="parentReplyId" value={parentReplyId} />
          )}
        </>
      )}
      <textarea
        name="description"
        rows={mode === "comment" ? 3 : 2}
        required
        autoFocus={autoFocus}
        defaultValue={initialValue}
        placeholder={placeholder}
        aria-invalid={Boolean(state.fieldErrors?.description)}
        className={cn(
          "w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
        )}
      />

      {/* Editing is text-only; new comments and replies may attach images. */}
      {!isEdit && (
        <input
          ref={fileInputRef}
          type="file"
          name="images"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          tabIndex={-1}
          className="sr-only"
          onChange={(event) => addFiles(event.target.files)}
        />
      )}

      {!isEdit && previews.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {previews.map((preview, index) => (
            <li
              key={preview.url}
              className="group relative size-16 overflow-hidden rounded-md border"
            >
              {/* Blob preview — next/image rejects blob: URLs, so use a plain img. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt={preview.file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label={t("replies.removeImage")}
                onClick={() => removeFile(index)}
                className="absolute end-1 top-1 inline-flex size-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {state.fieldErrors?.images && (
        <p className="text-xs text-destructive">{state.fieldErrors.images}</p>
      )}

      <div className="flex items-center gap-2">
        {!isEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("replies.attach")}
            title={t("replies.attach")}
            disabled={previews.length >= MAX_FILES}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip />
          </Button>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" />
          ) : isEdit ? (
            <Pencil />
          ) : (
            <Send />
          )}
          {pending
            ? isEdit
              ? t("replies.saving")
              : t("replies.sending")
            : isEdit
              ? t("replies.save")
              : t("replies.send")}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t("replies.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
