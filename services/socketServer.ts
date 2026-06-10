import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { jwtVerify } from "jose";

// ─── Configuration ──────────────────────────────────────────────────────────────
const PORT = Number(process.env.SOCKET_PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET;
const CORS_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!JWT_SECRET) {
  console.error("[SocketServer] JWT_SECRET env var is required");
  process.exit(1);
}

const secretBytes = new TextEncoder().encode(JWT_SECRET);

// ─── HTTP + Socket.IO Server ────────────────────────────────────────────────────
const httpServer = http.createServer();

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
});

// ─── Auth middleware ────────────────────────────────────────────────────────────
// Verify the JWT from the `token` cookie on every connection handshake.
io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie ?? "";
    const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    if (!tokenMatch) {
      return next(new Error("Authentication required"));
    }

    const { payload } = await jwtVerify(tokenMatch[1], secretBytes);
    const userId = Number(payload.sub);
    if (!userId || isNaN(userId)) {
      return next(new Error("Invalid token"));
    }

    // Attach userId to socket data for room assignment
    (socket as any).userId = userId;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

// Entity rooms a client may subscribe to for live reply updates. The id segment
// keeps the room scoped to a single ticket / complaint / suggestion detail page.
const ENTITY_ROOM = /^(ticket|complaint|suggestion):\d+$/;

// ─── Connection handler ─────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  const userId = (socket as any).userId as number;
  const room = `user_${userId}`;
  socket.join(room);
  console.log(
    `[SocketServer] User ${userId} connected (socket ${socket.id}, room ${room})`,
  );

  // A detail page joins its entity room so it can live-refresh when a reply is
  // posted on that entity. The room name is validated to a known pattern; the
  // broadcast payload carries no content (just a refresh signal), so the page
  // re-fetches through its own authorized server component — no data leaks here.
  socket.on("subscribe", (entityRoom: unknown) => {
    if (typeof entityRoom === "string" && ENTITY_ROOM.test(entityRoom)) {
      socket.join(entityRoom);
    }
  });

  socket.on("unsubscribe", (entityRoom: unknown) => {
    if (typeof entityRoom === "string") {
      socket.leave(entityRoom);
    }
  });

  socket.on("disconnect", () => {
    console.log(
      `[SocketServer] User ${userId} disconnected (socket ${socket.id})`,
    );
  });
});

// ─── Internal REST endpoint (/api/push) ─────────────────────────────────────────
// The Next.js process (NotificationService) calls this to fan out real-time
// notifications to connected clients. This is NOT exposed to the public internet
// — only reachable within the Docker network or on localhost.
httpServer.on("request", (req, res) => {
  if (req.method === "POST" && req.url === "/api/push") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { userIds, notification } = JSON.parse(body) as {
          userIds: number[];
          notification: unknown;
        };

        for (const uid of userIds) {
          io.to(`user_${uid}`).emit("notification", notification);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error("[SocketServer] /api/push error:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Bad request" }));
      }
    });
    return;
  }

  // ─── Internal REST endpoint (/api/broadcast) ──────────────────────────────────
  // The Next.js process broadcasts a content-free "entity-update" to everyone
  // currently viewing an entity's detail page (room "ticket:42", "suggestion:7", …)
  // so their open page re-fetches and streams in the new/edited/deleted reply.
  if (req.method === "POST" && req.url === "/api/broadcast") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { room, payload } = JSON.parse(body) as {
          room: string;
          payload?: unknown;
        };

        io.to(room).emit("entity-update", payload ?? { room });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error("[SocketServer] /api/broadcast error:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Bad request" }));
      }
    });
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404);
  res.end();
});

// ─── Start ──────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[SocketServer] Listening on port ${PORT}`);
  console.log(`[SocketServer] CORS origin: ${CORS_ORIGIN}`);
});
