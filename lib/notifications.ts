import type { NotificationEntityType } from "@/services";

// Maps a notification's polymorphic target (entity_type + entity_id) to the
// dashboard detail page it should open. Returns null when the target can't be
// resolved (missing type or id) so the caller can fall back to a list view.
export function notificationHref(
  entityType: NotificationEntityType | null | undefined,
  entityId: number | null | undefined,
): string | null {
  if (entityType == null || entityId == null) return null;
  switch (entityType) {
    case "ticket":
      return `/dashboard/tickets/${entityId}`;
    case "suggestion":
      return `/dashboard/suggestions/${entityId}`;
    case "complaint":
      return `/dashboard/complaints/${entityId}`;
    default:
      return null;
  }
}
