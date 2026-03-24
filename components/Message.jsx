'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';

export const Message = ({ thread, messages, setMessages }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]); // userIds currently typing
  const [onlineUsers, setOnlineUsers] = useState([]); // userIds online in thread
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null); // to debounce typing_stop

  const { currentUserId, token } = useAuth();
  const socket = useSocket(token);

  // ── Socket listeners ──
  useEffect(() => {
    if (!socket || !thread?.id) {
      console.log('socket or thread missing:', {
        socket: !!socket,
        threadId: thread?.id,
      });
      return;
    }

    console.log('joining thread:', thread.id);
    socket.emit('join_thread', thread.id);

    socket.on('message_received', (newMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });

    socket.on('message_deleted', (messageId) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    socket.on('user_typing', (userId) => {
      console.log('user_typing received:', userId); // add this
      setTypingUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    });

    socket.on('user_stopped_typing', (userId) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    socket.on('online_users', (userIds) => {
      setOnlineUsers(userIds);
    });

    socket.on('user_online', (userId) => {
      setOnlineUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    });

    socket.on('user_offline', (userId) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket.emit('leave_thread', thread.id);
      socket.off('message_received');
      socket.off('message_deleted');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('online_users');
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [socket, thread?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Typing emit with debounce ──
  const handleTyping = useCallback(
    (value) => {
      setMessage(value);
      if (!socket) return;

      console.log('emitting typing_start for thread:', thread.id); // add this
      socket.emit('typing_start', thread.id);

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', thread.id);
      }, 1500);
    },
    [socket, thread?.id]
  );

  // ── Send ──
  const handleSend = async () => {
    if (!message.trim() || sending) return;

    // Stop typing indicator immediately on send
    clearTimeout(typingTimeoutRef.current);
    if (socket) socket.emit('typing_stop', thread.id);

    setSending(true);
    try {
      const response = await fetch(`/api/threads/${thread.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });

      const newMessages = await response.json();
      const justCreated = newMessages[newMessages.length - 1];

      setMessages(newMessages);
      setMessage('');
      inputRef.current?.focus();

      if (socket) socket.emit('new_message', justCreated);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (messageId) => {
    setDeletingId(messageId);
    try {
      const response = await fetch(
        `/api/threads/${thread.id}/message/${messageId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        if (socket)
          socket.emit('delete_message', { threadId: thread.id, messageId });
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Typing indicator label ──
  // We show names not IDs — get them from messages we already have
  const getTypingLabel = () => {
    if (typingUsers.length === 0) return null;

    const names = typingUsers.map((uid) => {
      const found = messages.find((m) => m.user?.id === uid);
      return found?.user?.name ?? 'Someone';
    });

    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return 'Several people are typing...';
  };

  const typingLabel = getTypingLabel();

  // ── Online count (excluding self) ──
  const onlineCount = onlineUsers.filter((id) => id !== currentUserId).length;

  return (
    <div className="flex flex-col h-full bg-[#0f1f3d] text-white font-sans">
      {/* Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-lg">#</span>
          <span className="font-semibold">
            {thread?.title || 'conversation'}
          </span>
          <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">
            {messages?.length ?? 0}
          </span>
        </div>

        {/* Online presence */}
        <div className="flex items-center gap-2 text-sm text-white/40">
          {onlineCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">
                {onlineCount} online
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {messages?.length > 0 ? (
          messages.map((msg) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              isOwn={String(msg.user?.id) === String(currentUserId)}
              isDeleting={deletingId === msg.id}
              isOnline={onlineUsers.includes(msg.user?.id)}
              onDelete={
                msg.user?.id === currentUserId
                  ? () => handleDelete(msg.id)
                  : null
              }
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
            <span className="text-4xl">💬</span>
            <p className="text-sm">No messages yet. Start the conversation.</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      <div className="px-6 h-5 flex items-center">
        {typingLabel && (
          <p className="text-xs text-white/40 italic animate-pulse">
            {typingLabel}
          </p>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-1 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2 bg-[#1a3260] rounded-xl px-4 py-3 ring-1 ring-white/10 focus-within:ring-white/25 transition-all duration-200">
          <button className="text-white/40 hover:text-white/70 transition-colors text-xl leading-none">
            +
          </button>
          <input
            ref={inputRef}
            type="text"
            value={message}
            placeholder={`Message #${thread?.title || 'channel'}`}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-sm placeholder-white/30 text-white"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 shrink-0
              ${
                message.trim() && !sending
                  ? 'bg-amber-400 text-black hover:bg-amber-300'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
          >
            {sending ? '…' : '↑'}
          </button>
        </div>
        <p className="text-white/20 text-xs mt-2 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

function MessageRow({ msg, isOwn, isDeleting, onDelete, isOnline }) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setConfirmDelete(false);
      }}
      className={`flex items-end gap-2 px-2 py-1 transition-all duration-150
        ${isOwn ? 'flex-row-reverse' : 'flex-row'}
        ${isDeleting ? 'opacity-40 scale-95' : ''}
      `}
    >
      {/* Avatar with online dot */}
      {!isOwn && (
        <div className="relative shrink-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
            {msg.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0f1f3d]" />
          )}
        </div>
      )}

      <div
        className={`flex flex-col max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}
      >
        {!isOwn && (
          <div className="flex items-baseline gap-2 mb-1 px-1">
            <span className="text-xs font-semibold text-white/70">
              {msg.user?.name ?? 'Unknown'}
            </span>
            <span className="text-xs text-white/30">
              {msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </span>
          </div>
        )}

        <div
          className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <div
            className={`px-4 py-2 rounded-2xl text-sm leading-relaxed break-words
              ${
                isOwn
                  ? 'bg-amber-400 text-black rounded-br-sm'
                  : 'bg-[#1a3260] text-white/85 rounded-bl-sm'
              }`}
          >
            {msg.content}
          </div>

          {isOwn && onDelete && (
            <div
              className={`transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`}
            >
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150
                  ${
                    confirmDelete
                      ? 'bg-red-500 text-white hover:bg-red-400'
                      : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
                  }`}
              >
                {isDeleting ? '…' : confirmDelete ? '✕ Sure?' : '🗑'}
              </button>
            </div>
          )}
        </div>

        {isOwn && (
          <span className="text-xs text-white/30 mt-1 px-1">
            {msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default Message;
