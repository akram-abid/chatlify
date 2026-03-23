'use client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export function useSocket(token) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    if (!socketInstance) {
      socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
        auth: { token },
      });
    }

    setSocket(socketInstance);
  }, [token]);

  return socket;
}