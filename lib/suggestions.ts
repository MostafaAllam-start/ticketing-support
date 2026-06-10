import type { AuthUser } from "@/services";
import { UserRole } from "@/lib/auth/roles";

// Who may open a suggestion's detail page and take part in its conversation:
// its author (a plain user reads/replies on their own suggestion), any admin, or
// a manager/member of the project the suggestion is scoped to. Shared by the
// user-facing detail page and the suggestion reply server actions so the page
// gate and the action gate can never drift apart.
export function canAccessSuggestion(
  user: AuthUser,
  suggestion: { createdById: number; project: { id: number } | null },
): boolean {
  if (suggestion.createdById === user.id) return true;
  if (user.userRole === UserRole.Admin) return true;
  const projectIds = new Set([
    ...user.managedProjectIds,
    ...user.memberships.map((membership) => membership.projectId),
  ]);
  return suggestion.project != null && projectIds.has(suggestion.project.id);
}
