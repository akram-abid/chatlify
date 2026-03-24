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

  // Attach Socket.io to the same HTTP server
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // ── Middleware: authenticate every socket connection ──
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Unauthorized'));

      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      // Attach userId to the socket so we can use it later
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // ── Workspace presence (join as soon as user opens the workspace) ──
    socket.on('join_workspace', async (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);

      // Tell others this user is now online
      socket.to(`workspace:${workspaceId}`).emit('user_online', socket.userId);

      // Tell the joining user who's already online in this workspace
      const sockets = await io.in(`workspace:${workspaceId}`).fetchSockets();
      const onlineUserIds = sockets
        .map((s) => s.userId)
        .filter((id) => id !== socket.userId);

      socket.emit('online_users', onlineUserIds);

      console.log(`User ${socket.userId} joined workspace ${workspaceId}`);
    });

    socket.on('leave_workspace', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
      socket.to(`workspace:${workspaceId}`).emit('user_offline', socket.userId);
    });

    // ── Thread room (only for messages and typing) ──
    socket.on('join_thread', (threadId) => {
      socket.join(`thread:${threadId}`);
    });

    socket.on('leave_thread', (threadId) => {
      socket.leave(`thread:${threadId}`);
      // also clear typing when leaving
      socket
        .to(`thread:${threadId}`)
        .emit('user_stopped_typing', socket.userId);
    });

    // ── Messages ──
    socket.on('new_message', (message) => {
      io.to(`thread:${message.threadId}`).emit('message_received', message);
    });

    socket.on('delete_message', ({ threadId, messageId }) => {
      io.to(`thread:${threadId}`).emit('message_deleted', messageId);
    });

    // ── Typing (thread-scoped, makes sense) ──
    socket.on('typing_start', (threadId) => {
      socket.to(`thread:${threadId}`).emit('user_typing', socket.userId);
    });

    socket.on('typing_stop', (threadId) => {
      socket
        .to(`thread:${threadId}`)
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
  });

  httpServer.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});
