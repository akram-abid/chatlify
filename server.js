import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { jwtVerify } from 'jose';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // ── Auth middleware ──
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Unauthorized'));
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Global online presence map: userId → Set of socketIds ──
  // A user can have multiple tabs open, so we count connections not just booleans
  const onlineUsers = new Map(); // userId → Set<socketId>

  const userCameOnline = (userId, socketId) => {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socketId);
  };

  const userWentOffline = (userId, socketId) => {
    const sockets = onlineUsers.get(userId);
    if (!sockets) return false;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      onlineUsers.delete(userId);
      return true; // truly offline now
    }
    return false;
  };

  const getOnlineUserIds = () => [...onlineUsers.keys()];

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // ── Global presence: mark online immediately on connect ──
    userCameOnline(socket.userId, socket.id);
    // Tell everyone this user is now online
    socket.broadcast.emit('global_user_online', socket.userId);
    // Tell the connecting user who's already online
    socket.emit('global_online_users', getOnlineUserIds());

    // ── Workspace presence ──
    socket.on('join_workspace', async (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      socket.to(`workspace:${workspaceId}`).emit('user_online', socket.userId);

      const sockets = await io.in(`workspace:${workspaceId}`).fetchSockets();
      const onlineUserIds = sockets
        .map((s) => s.userId)
        .filter((id) => id !== socket.userId);
      socket.emit('online_users', onlineUserIds);
    });

    socket.on('leave_workspace', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
      socket.to(`workspace:${workspaceId}`).emit('user_offline', socket.userId);
    });

    // ── Thread rooms ──
    socket.on('join_thread', (threadId) => {
      socket.join(`thread:${threadId}`);
    });

    socket.on('leave_thread', (threadId) => {
      socket.leave(`thread:${threadId}`);
      socket
        .to(`thread:${threadId}`)
        .emit('user_stopped_typing', socket.userId);
    });

    socket.on('typing_start', (threadId) => {
      socket.to(`thread:${threadId}`).emit('user_typing', socket.userId);
    });

    socket.on('typing_stop', (threadId) => {
      socket
        .to(`thread:${threadId}`)
        .emit('user_stopped_typing', socket.userId);
    });

    // ── DM conversation rooms ──
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      socket
        .to(`conversation:${conversationId}`)
        .emit('user_stopped_typing', socket.userId);
    });

    // message has shape: { id, content, createdAt, user: { id, name, email }, roomId }
    socket.on('new_message', (message) => {
      if (message.roomId) {
        // DM — use io.to (includes sender) so sender's own preview also updates
        io.to(`conversation:${message.roomId}`).emit(
          'message_received',
          message
        );
        // Separate event for sidebar preview — fires even on inactive conversations
        io.to(`conversation:${message.roomId}`).emit('dm_message_received', {
          ...message,
          dmRoomId: message.roomId,
        });
      } else if (message.threadId) {
        io.to(`thread:${message.threadId}`).emit('message_received', message);
      }
    });

    socket.on('delete_message', ({ threadId, conversationId, messageId }) => {
      if (conversationId) {
        io.to(`conversation:${conversationId}`).emit(
          'message_deleted',
          messageId
        );
      } else if (threadId) {
        io.to(`thread:${threadId}`).emit('message_deleted', messageId);
      }
    });

    socket.on('dm_typing_start', (conversationId) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit('user_typing', socket.userId);
    });

    socket.on('dm_typing_stop', (conversationId) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit('user_stopped_typing', socket.userId);
    });

    // ── Disconnect ──
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit('user_offline', socket.userId);
          socket.to(room).emit('user_stopped_typing', socket.userId);
        }
      }
    });

    socket.on('disconnect', () => {
      const trulyOffline = userWentOffline(socket.userId, socket.id);
      if (trulyOffline) {
        socket.broadcast.emit('global_user_offline', socket.userId);
        console.log(`User truly offline: ${socket.userId}`);
      }
    });
  });

  httpServer.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});
