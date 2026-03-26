'use client';
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socket = null; // singleton — one connection for the whole app

export function useSocket(token) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // Create connection once, reuse it
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
        auth: { token }, // this is how we send the JWT to server.js middleware
      });
    }

    socketRef.current = socket;

    return () => {
      // Don't disconnect on unmount — keep the singleton alive
    };
  }, [token]);

  return socketRef.current;
}