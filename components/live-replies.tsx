"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

/**
 * Drop this on any detail page that renders a reply thread. It joins the entity's
 * room on the realtime socket server and, whenever a reply is posted / edited /
 * deleted on that entity (by anyone, anywhere), calls router.refresh() so the
 * server component re-fetches and the new conversation state streams in.
 *
 * It renders nothing. `room` is the same string the server broadcasts to — e.g.
 * `ticket:42`, `suggestion:7` (see realtime/liveReplies.ts → liveRoom).
 */
export function LiveReplies({ room }: { room: string }) {
  const router = useRouter();

  // Keep the latest refresh in a ref so re-renders don't tear down and recreate
  // the socket (which would drop any update that lands during the gap). The ref
  // is synced in an effect — never written during render.
  const refreshRef = useRef<() => void>(() => {});
  useEffect(() => {
    refreshRef.current = () => router.refresh();
  }, [router]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => socket.emit("subscribe", room));
    socket.on("entity-update", () => refreshRef.current());

    return () => {
      socket.emit("unsubscribe", room);
      socket.disconnect();
    };
  }, [room]);

  return null;
}
