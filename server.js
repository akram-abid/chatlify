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

  // ── Connection handler ──
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Client joins a thread room
    socket.on('join_thread', (threadId) => {
      socket.join(threadId);
      console.log(`User ${socket.userId} joined thread ${threadId}`);
    });

    // Client leaves a thread room
    socket.on('leave_thread', (threadId) => {
      socket.leave(threadId);
    });

    // Client sends a new message
    socket.on('new_message', (message) => {
      // Broadcast to everyone in the room INCLUDING the sender
      io.to(message.threadId).emit('message_received', message);
    });

    // Client deletes a message
    socket.on('delete_message', ({ threadId, messageId }) => {
      io.to(threadId).emit('message_deleted', messageId);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  httpServer.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});