"use client";

import {
  BarChart3,
  Building2,
  Contact,
  Handshake,
  Inbox,
  LogOut,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { logoutAction } from "../actions";

type NavItem = { href: string; key: string; icon: LucideIcon };

// Sidebar sections per role.
const NAV: Record<string, NavItem[]> = {
  admin: [
    { href: "/dashboard/kpis", key: "kpis", icon: BarChart3 },
    { href: "/dashboard/users", key: "users", icon: Users },
    { href: "/dashboard/issues", key: "issues", icon: Inbox },
    { href: "/dashboard/team-members", key: "teamMembers", icon: Contact },
    { href: "/dashboard/partners", key: "partners", icon: Handshake },
    { href: "/dashboard/companies", key: "companies", icon: Building2 },
  ],
  "software-engineer": [
    { href: "/dashboard/kpis", key: "kpis", icon: BarChart3 },
    { href: "/dashboard/tickets", key: "myTickets", icon: Ticket },
  ],
  reviewer: [
    { href: "/dashboard/kpis", key: "kpis", icon: BarChart3 },
    { href: "/dashboard/tickets", key: "reportedTickets", icon: Ticket },
  ],
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DashboardSidebar({
  role,
  user,
  side = "left",
}: {
  role: string;
  user: { name: string; username: string };
  side?: "left" | "right";
}) {
  const t = useTranslations("Dashboard");
  const pathname = usePathname();
  const items = NAV[role] ?? [];

  return (
    <Sidebar side={side}>
      <SidebarHeader className="items-center p-3">
        <Logo badge={false} imageClassName="h-12" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{t(`nav.${item.key}`)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8 rounded-md">
                    <AvatarFallback className="rounded-md text-xs">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      @{user.username}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
              >
                <DropdownMenuLabel>{t("account")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground"
                  >
                    <LogOut className="size-4" />
                    {t("logout")}
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
