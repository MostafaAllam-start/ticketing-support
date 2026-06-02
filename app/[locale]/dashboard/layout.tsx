import { setRequestLocale } from "next-intl/server";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { requireDashboardUser } from "@/lib/auth/guards";
import { ticketService } from "@/services";
import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { NotificationBell } from "./_components/notification-bell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireDashboardUser();

  // The sidebar is pinned with physical left/right, which don't flip under
  // dir="rtl", so place it on the right for the RTL (Arabic) locale.
  const side = locale === "ar" ? "right" : "left";

  // Notification feed: the most recent tickets relevant to this role (engineers
  // see tickets assigned to them; admins/reviewers see the reported queue).
  const isEngineer = user.role.name === "software-engineer";
  const recentTickets = isEngineer
    ? await ticketService.assignedTo(user.id)
    : await ticketService.reported();
  const notifications = recentTickets.slice(0, 5).map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString().slice(0, 10),
  }));
  const notificationsHref =
    user.role.name === "admin" ? "/dashboard/issues" : "/dashboard/tickets";

  return (
    <SidebarProvider>
      <DashboardSidebar
        role={user.role.name}
        side={side}
        user={{ name: user.name, username: user.username }}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="ms-auto flex items-center gap-2">
            <NotificationBell
              notifications={notifications}
              viewAllHref={notificationsHref}
            />
            <ThemeToggle />
            <LocaleSwitcher />
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
