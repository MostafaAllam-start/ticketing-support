"use client";

import type { ReactNode } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { markNotificationReadAction } from "../notification-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notificationHref } from "@/lib/notifications";
import type { NotificationEntityType } from "@/services";

export type NotificationItem = {
  id: number;
  title: string;
  details?: string;
  createdAt: string; // YYYY-MM-DD
  isRead: boolean;
  // The record this notification points at, used to deep-link to its detail page.
  entityType: NotificationEntityType;
  entityId: number;
};

// Bell button in the dashboard header. Clicking it opens a dropdown listing the
// most recent items; the count badge shows how many are unseen this session.
function NotificationLink({
  item,
  href,
  children,
}: {
  item: NotificationItem;
  href: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={cn(!item.isRead && "bg-accent/40")}
      onClick={(event) => {
        event.preventDefault();
        void (async () => {
          if (!item.isRead) {
            await markNotificationReadAction(item.id);
          }
          router.push(href);
        })();
      }}
    >
      {children}
    </Link>
  );
}

export function NotificationBell({
  notifications,
  unreadCount,
  viewAllHref,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
  viewAllHref: string;
}) {
  const t = useTranslations("Dashboard");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative"
          aria-label={t("notifications.title")}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -end-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t("notifications.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {t("notifications.empty")}
          </p>
        ) : (
          <>
            {notifications.map((item) => {
              const href =
                notificationHref(item.entityType, item.entityId) ?? viewAllHref;
              return (
                <DropdownMenuItem
                  key={item.id}
                  asChild
                  className={cn(!item.isRead && "bg-accent/40")}
                >
                  <NotificationLink item={item} href={href}>
                    <div className="flex w-full min-w-0 flex-col gap-0.5">
                      <span
                        className={cn(
                          "truncate",
                          !item.isRead && "font-semibold",
                        )}
                      >
                        {item.title}
                      </span>
                      {item.details && (
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {item.details}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {item.createdAt}
                      </span>
                    </div>
                  </NotificationLink>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={viewAllHref}
                className="justify-center font-medium text-primary"
              >
                {t("notifications.viewAll")}
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
