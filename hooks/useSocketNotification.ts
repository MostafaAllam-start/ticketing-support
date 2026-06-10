import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

/**
 * Custom hook to subscribe to real-time notifications via Socket.IO.
 *
 * The connection is established once on mount. The latest `onNotification`
 * callback is kept in a ref so a changing handler identity (the consumer
 * recreates it on every render) does NOT tear down and reconnect the socket —
 * reconnect churn drops any push that arrives during the disconnected window.
 */
export function useSocketNotification(onNotification: (notification: any) => void) {
  const handlerRef = useRef(onNotification);
  handlerRef.current = onNotification;

  useEffect(() => {
    // In development or production, connect with user session cookies sent automatically.
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[useSocketNotification] Connected to Socket.IO notification server");
    });

    socket.on("notification", (notification) => {
      handlerRef.current(notification);
    });

    socket.on("connect_error", (error) => {
      console.error("[useSocketNotification] Connection error:", error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
}
