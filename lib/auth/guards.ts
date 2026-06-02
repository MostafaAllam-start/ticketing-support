import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { userService } from "@/services";
import type { AuthUser } from "@/services";

const PRIVILEGED = ["admin", "software-engineer", "reviewer"] as const;
export type PrivilegedRole = (typeof PRIVILEGED)[number];

// Roles allowed to manage any ticket: create, edit, delete, and assign it to
// software-engineers. Software-engineers and plain users cannot.
const TICKET_MANAGERS = ["admin", "reviewer"] as const;

// Roles that get the dashboard instead of the public landing page.
export function isPrivileged(role: string): role is PrivilegedRole {
  return (PRIVILEGED as readonly string[]).includes(role);
}

// Whether a role may manage tickets (incl. assigning engineers). Used to gate UI;
// the matching server actions re-check with requireRole("admin", "reviewer").
export function canManageTickets(role: string): boolean {
  return (TICKET_MANAGERS as readonly string[]).includes(role);
}

// Gate for the dashboard: anonymous -> /login, plain "user" -> landing,
// privileged -> returns the authenticated user. Call at the top of dashboard
// server components. `redirect()` throws, so the trailing throw is unreachable —
// it only satisfies the return type.
export async function requireDashboardUser(): Promise<AuthUser> {
  const user = await userService.currentUser();
  if (user && isPrivileged(user.role.name)) {
    return user;
  }
  const locale = await getLocale();
  redirect({ href: user ? "/" : "/login", locale });
  throw new Error("unreachable");
}

// Gate for the authenticated "user" surface (e.g. /tickets): anonymous -> /login,
// privileged roles -> their dashboard, plain "user" -> returns the user.
export async function requireUser(): Promise<AuthUser> {
  const user = await userService.currentUser();
  const locale = await getLocale();
  if (!user) {
    redirect({ href: "/login", locale });
    throw new Error("unreachable");
  }
  if (isPrivileged(user.role.name)) {
    redirect({ href: "/dashboard", locale });
    throw new Error("unreachable");
  }
  return user;
}

// Page-level gate for routes restricted to specific roles (e.g. admin-only).
export async function requireRole(...roles: string[]): Promise<AuthUser> {
  const user = await requireDashboardUser();
  if (roles.includes(user.role.name)) {
    return user;
  }
  redirect({ href: "/dashboard", locale: await getLocale() });
  throw new Error("unreachable");
}
