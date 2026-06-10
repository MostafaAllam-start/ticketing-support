"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Reply as ReplyIcon, Send, Trash2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import type { ReplyWithAuthor } from "@/services";
import {
  deleteSuggestionReplyAction,
  postSuggestionReplyAction,
  type SuggestionState,
} from "../../suggestion-actions";

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

// Renders a suggestion's replies as an attributed conversation (comments +
// threaded replies, kept one level deep). Each message carries a delete icon,
// and each top-level comment a reply icon that reveals an inline composer; a
// composer at the bottom adds a new top-level comment.
export function SuggestionReplies({
  suggestionId,
  currentUserId,
  canModerate = false,
  replies,
}: {
  suggestionId: number;
  currentUserId: number;
  // Whether the viewer may delete replies that aren't their own (admins). Authors
  // can always delete their own messages regardless of this flag.
  canModerate?: boolean;
  replies: ReplyWithAuthor[];
}) {
  const t = useTranslations("Dashboard");

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
    <section>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">
        {t("suggestions.replies.title")}
        {replies.length > 0 && (
          <span className="ms-2 text-sm font-normal text-muted-foreground">
            ({replies.length})
          </span>
        )}
      </h2>

      {topLevel.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("suggestions.replies.empty")}
        </div>
      ) : (
        <ol className="space-y-6">
          {topLevel.map((reply) => (
            <TopLevelComment
              key={reply.id}
              suggestionId={suggestionId}
              currentUserId={currentUserId}
              canModerate={canModerate}
              reply={reply}
              childReplies={childrenByParent.get(reply.id) ?? []}
            />
          ))}
        </ol>
      )}

      <div className="mt-6 border-t pt-6">
        <Composer suggestionId={suggestionId} variant="comment" />
      </div>
    </section>
  );
}

// A top-level comment, its direct children, and the inline reply composer it
// toggles open.
function TopLevelComment({
  suggestionId,
  currentUserId,
  canModerate,
  reply,
  childReplies,
}: {
  suggestionId: number;
  currentUserId: number;
  canModerate: boolean;
  reply: ReplyWithAuthor;
  childReplies: ReplyWithAuthor[];
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const closeReply = useCallback(() => setReplyOpen(false), []);

  return (
    <li className="space-y-3">
      <Message
        suggestionId={suggestionId}
        reply={reply}
        mine={reply.user.id === currentUserId}
        canModerate={canModerate}
        onReply={() => setReplyOpen((open) => !open)}
      />

      {childReplies.length > 0 && (
        <ol className="space-y-3 ps-10">
          {childReplies.map((child) => (
            <li key={child.id}>
              <Message
                suggestionId={suggestionId}
                reply={child}
                mine={child.user.id === currentUserId}
                canModerate={canModerate}
              />
            </li>
          ))}
        </ol>
      )}

      {replyOpen && (
        <div className="ps-10">
          <Composer
            suggestionId={suggestionId}
            parentReplyId={reply.id}
            variant="reply"
            autoFocus
            onPosted={closeReply}
          />
        </div>
      )}
    </li>
  );
}

// A single attributed message with its action row (reply — top-level only — and
// delete).
function Message({
  suggestionId,
  reply,
  mine,
  canModerate,
  onReply,
}: {
  suggestionId: number;
  reply: ReplyWithAuthor;
  mine: boolean;
  canModerate: boolean;
  onReply?: () => void;
}) {
  const t = useTranslations("Dashboard");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const roleKey = `suggestions.replies.roles.${reply.user.role.name}`;
  const roleLabel = mine
    ? t("suggestions.replies.you")
    : t.has(roleKey)
      ? t(roleKey)
      : reply.user.role.name;

  return (
    <div className={cn("flex gap-3", mine && "flex-row-reverse")}>
      <Avatar size="sm" className="mt-0.5">
        {reply.user.image && <AvatarImage src={reply.user.image} alt="" />}
        <AvatarFallback>{initials(reply.user.name)}</AvatarFallback>
      </Avatar>

      <div className={cn("flex max-w-[80%] flex-col gap-1", mine && "items-end")}>
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs text-muted-foreground",
            mine && "flex-row-reverse",
          )}
        >
          <span className="font-medium text-foreground">{reply.user.name}</span>
          <span aria-hidden>·</span>
          <span>{roleLabel}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{formatDate(reply.createdAt)}</span>
        </div>

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

        <div className={cn("flex items-center gap-1", mine && "flex-row-reverse")}>
          {onReply && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              onClick={onReply}
            >
              <ReplyIcon className="size-3.5" />
              {t("suggestions.replies.reply")}
            </Button>
          )}
          {(mine || canModerate) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
              {t("suggestions.replies.delete")}
            </Button>
          )}
        </div>
      </div>

      <DeleteReplyDialog
        suggestionId={suggestionId}
        replyId={reply.id}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}

// Confirms removal of a reply (and, for a top-level comment, its thread).
function DeleteReplyDialog({
  suggestionId,
  replyId,
  open,
  onOpenChange,
}: {
  suggestionId: number;
  replyId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Dashboard");
  const [state, formAction, pending] = useActionState<SuggestionState, FormData>(
    deleteSuggestionReplyAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(t("suggestions.replies.deleted"));
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} onReset={keepInputOnError(state)} className="grid gap-4">
          <input type="hidden" name="replyId" value={replyId} />
          <input type="hidden" name="suggestionId" value={suggestionId} />
          <DialogHeader>
            <DialogTitle>
              {t("suggestions.replies.deleteConfirm.title")}
            </DialogTitle>
            <DialogDescription>
              {t("suggestions.replies.deleteConfirm.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t("suggestions.replies.deleteConfirm.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {pending
                ? t("suggestions.replies.deleteConfirm.deleting")
                : t("suggestions.replies.deleteConfirm.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// The message input. Posts through the shared server action; on success the page
// is revalidated (so the new message streams in) and the field is cleared.
function Composer({
  suggestionId,
  parentReplyId,
  variant,
  autoFocus,
  onPosted,
}: {
  suggestionId: number;
  parentReplyId?: number;
  variant: "comment" | "reply";
  autoFocus?: boolean;
  onPosted?: () => void;
}) {
  const t = useTranslations("Dashboard");
  const [state, action, pending] = useActionState(postSuggestionReplyAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      onPosted?.();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onPosted]);

  return (
    <form ref={formRef} action={action} onReset={keepInputOnError(state)} className="flex flex-col gap-2">
      <input type="hidden" name="suggestionId" value={suggestionId} />
      {parentReplyId != null && (
        <input type="hidden" name="parentReplyId" value={parentReplyId} />
      )}
      <textarea
        name="description"
        rows={variant === "reply" ? 2 : 3}
        required
        autoFocus={autoFocus}
        placeholder={
          variant === "reply"
            ? t("suggestions.replies.replyPlaceholder")
            : t("suggestions.replies.placeholder")
        }
        aria-invalid={Boolean(state.fieldErrors?.description)}
        className={cn(
          "w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
        )}
      />
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? <Loader2 className="animate-spin" /> : <Send />}
        {pending
          ? t("suggestions.replies.sending")
          : t("suggestions.replies.send")}
      </Button>
    </form>
  );
}
