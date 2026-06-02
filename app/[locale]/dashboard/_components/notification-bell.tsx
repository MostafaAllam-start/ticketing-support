"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type NotificationItem = {
  id: number;
  title: string;
  status: "open" | "in_progress" | "closed";
  createdAt: string; // YYYY-MM-DD
};

// Bell button in the dashboard header. Clicking it opens a dropdown listing the
// most recent items; the count badge shows how many are unseen this session.
export function NotificationBell({
  notifications,
  viewAllHref,
}: {
  notifications: NotificationItem[];
  viewAllHref: string;
}) {
  const t = useTranslations("Dashboard");
  const count = notifications.length;

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
          {count > 0 && (
            <span className="absolute -top-1 -end-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none font-medium text-primary-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t("notifications.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {count === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {t("notifications.empty")}
          </p>
        ) : (
          <>
            {notifications.map((item) => (
              <DropdownMenuItem key={item.id} asChild>
                <Link href={viewAllHref}>
                  <div className="flex w-full min-w-0 flex-col gap-0.5">
                    <span className="truncate font-medium">{item.title}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{t(`status.${item.status}`)}</span>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">{item.createdAt}</span>
                    </span>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
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
