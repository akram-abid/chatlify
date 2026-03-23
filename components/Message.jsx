'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';

export const Message = ({ thread, messages, setMessages }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { currentUserId, token } = useAuth(); // we'll add token to context next
  const socket = useSocket(token);

  // ── Join/leave the thread room ──
  useEffect(() => {
    if (!socket || !thread?.id) return;

    socket.emit('join_thread', thread.id);

    // Listen for new messages from other users
    socket.on('message_received', (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates (our own message is already added optimistically)
        if (prev.find((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });

    // Listen for deleted messages
    socket.on('message_deleted', (messageId) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    return () => {
      socket.emit('leave_thread', thread.id);
      socket.off('message_received');
      socket.off('message_deleted');
    };
  }, [socket, thread?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
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

      // Guard before emitting
      if (socket) {
        socket.emit('new_message', justCreated);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId) => {
    setDeletingId(messageId);
    try {
      const response = await fetch(
        `/api/threads/${thread.id}/message/${messageId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        // Update our own UI
        setMessages((prev) => prev.filter((m) => m.id !== messageId));

        if (socket) {
          socket.emit('delete_message', { threadId: thread.id, messageId });
        }
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1f3d] text-white font-sans">
      {/* Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-white/10 bg-[#0f1f3d]/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-lg font-light">#</span>
          <span className="font-semibold tracking-wide">
            {thread?.title || 'conversation'}
          </span>
          <span className="ml-2 text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">
            {messages?.length ?? 0}
          </span>
        </div>
        <div className="flex items-center gap-3 text-white/40">
          <button className="hover:text-white/80 transition-colors text-sm">
            ⓘ
          </button>
          <button className="hover:text-white/80 transition-colors text-sm">
            ⚙️
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {messages?.length > 0 ? (
          messages.map((msg) => {
            const isOwn = msg.user?.id === currentUserId;
            return (
              <MessageRow
                key={msg.id}
                msg={msg}
                isOwn={isOwn}
                isDeleting={deletingId === msg.id}
                onDelete={isOwn ? () => handleDelete(msg.id) : null}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
            <span className="text-4xl">💬</span>
            <p className="text-sm">No messages yet. Start the conversation.</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2 bg-[#1a3260] rounded-xl px-4 py-3 ring-1 ring-white/10 focus-within:ring-white/25 transition-all duration-200">
          <button className="text-white/40 hover:text-white/70 transition-colors text-xl leading-none">
            +
          </button>
          <input
            ref={inputRef}
            type="text"
            value={message}
            placeholder={`Message #${thread?.title || 'channel'}`}
            onChange={(e) => setMessage(e.target.value)}
            /*onKeyDown={handleKeyDown}*/
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

function MessageRow({ msg, isOwn, isDeleting, onDelete }) {
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
      {/* Avatar — hidden for own messages */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mb-1">
          {msg.user?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
      )}

      <div
        className={`flex flex-col max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}
      >
        {/* Name + time */}
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
          {/* Bubble */}
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

          {/* Delete — only for own messages, only on hover */}
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

        {/* Timestamp for own messages */}
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
