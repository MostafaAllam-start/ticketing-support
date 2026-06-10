// Live reply updates: when a reply is posted, edited, or deleted on an entity,
// every open detail page subscribed to that entity's room re-fetches and streams
// the change in. This mirrors NotificationService.pushRealtime — same socket
// server, same internal URL — but uses a dedicated "entity-update" channel and an
// entity room (not a per-user room), so it reaches everyone viewing the entity
// regardless of whether they are a notification recipient.

// In Docker the socket server is reachable at http://realtime:3001; locally 3001.
const SOCKET_SERVER_URL =
  process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";

// The entity whose detail page renders the reply thread. Report and complaint
// replies live on the ticket / complaint detail page, so they broadcast to that
// page's room rather than a room of their own.
export type LiveRoomEntity = "ticket" | "complaint" | "suggestion";

// The room a detail page subscribes to and a reply mutation broadcasts to. Must
// match the pattern validated in socketServer.ts.
export function liveRoom(entity: LiveRoomEntity, id: number): string {
  return `${entity}:${id}`;
}

// Fire-and-forget broadcast that tells every client in `room` to refresh. The
// payload carries no reply content — only a refresh signal — so an unauthorized
// subscriber learns nothing it couldn't already (their refresh re-checks access).
// Errors are swallowed: a reply must still succeed if the socket server is down.
export async function broadcastEntityUpdate(room: string): Promise<void> {
  try {
    const response = await fetch(`${SOCKET_SERVER_URL}/api/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room }),
    });
    if (!response.ok) {
      console.error(
        `[LiveReplies] Failed to broadcast to ${room}, status: ${response.status}`,
      );
    }
  } catch (err) {
    console.error(`[LiveReplies] Error broadcasting to ${room}:`, err);
  }
}
