'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';
import {
  faHashtag,
  faPaperPlane,
  faPlus,
  faTrash,
  faAt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/* ── avatar gradients ── */
const GRADIENTS = [
  'linear-gradient(135deg, #11a2d6, #0b6fa0)',
  'linear-gradient(135deg, #7c3aed, #5b21b6)',
  'linear-gradient(135deg, #0d9488, #0f766e)',
  'linear-gradient(135deg, #d97706, #b45309)',
  'linear-gradient(135deg, #e11d48, #be123c)',
  'linear-gradient(135deg, #059669, #047857)',
  'linear-gradient(135deg, #2563eb, #1d4ed8)',
];
const getGradient = (name = '') =>
  GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];

const formatTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ──────────────────────────────────────────────
   MAIN MESSAGE COMPONENT
────────────────────────────────────────────── */
export const Message = ({
  thread, // in workspace mode: the thread object
  // in DM mode: the conversation object ({ id, name, userId, ... })
  messages,
  setMessages,
  onlineUsers = [],
  isDMMode = false,
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [newMsgIds, setNewMsgIds] = useState(new Set());

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { currentUserId, token } = useAuth();
  const socket = useSocket(token);

  // The active "room" id — threadId in workspace mode, conversationId in DM mode
  const roomId = thread?.id;

  /* ── API URLs based on mode ── */
  const getMessagesUrl = () =>
    isDMMode ? `/api/dm/${roomId}/messages` : `/api/threads/${roomId}/message`;

  const postMessageUrl = () =>
    isDMMode ? `/api/dm/${roomId}/messages` : `/api/threads/${roomId}/message`;

  const deleteMessageUrl = (msgId) =>
    isDMMode
      ? `/api/dm/${roomId}/messages/${msgId}`
      : `/api/threads/${roomId}/message/${msgId}`;

  /* ── Socket ── */
  useEffect(() => {
    if (!socket || !roomId) return;

    const joinEvent = isDMMode ? 'join_conversation' : 'join_thread';
    const leaveEvent = isDMMode ? 'leave_conversation' : 'leave_thread';

    socket.emit(joinEvent, roomId);

    socket.on('message_received', (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setNewMsgIds((s) => new Set([...s, msg.id]));
      setTimeout(() => {
        setNewMsgIds((s) => {
          const n = new Set(s);
          n.delete(msg.id);
          return n;
        });
      }, 600);
    });

    socket.on('message_deleted', (id) =>
      setMessages((prev) => prev.filter((m) => m.id !== id))
    );
    socket.on('user_typing', (uid) =>
      setTypingUsers((p) => (p.includes(uid) ? p : [...p, uid]))
    );
    socket.on('user_stopped_typing', (uid) =>
      setTypingUsers((p) => p.filter((id) => id !== uid))
    );

    return () => {
      socket.emit(leaveEvent, roomId);
      socket.off('message_received');
      socket.off('message_deleted');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [socket, roomId, isDMMode]);

  /* ── Auto scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Handlers ── */
  const handleTyping = useCallback((v) => setMessage(v), []);
  const handleFocus = useCallback(() => {
    if (isDMMode) socket?.emit('dm_typing_start', roomId);
    else socket?.emit('typing_start', roomId);
  }, [socket, roomId, isDMMode]);

  const handleBlur = useCallback(() => {
    if (isDMMode) socket?.emit('dm_typing_stop', roomId);
    else socket?.emit('typing_stop', roomId);
  }, [socket, roomId, isDMMode]);

  const handleSend = async () => {
    if (!message.trim() || sending || !roomId) return;
    clearTimeout(typingTimeoutRef.current);
    socket?.emit('typing_stop', roomId);
    setSending(true);
    try {
      const res = await fetch(postMessageUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });

      if (!res.ok) {
        console.error('Send failed:', res.status, await res.text());
        return;
      }

      const data = await res.json();

      // Both routes return an array — workspace returns all msgs, DM returns [newMsg]
      if (!Array.isArray(data) || data.length === 0) {
        console.error('Unexpected response shape:', data);
        return;
      }

      const justCreated = data[data.length - 1];

      if (isDMMode) {
        // DM: append the single new message instead of replacing all
        setMessages((prev) => {
          if (prev.find((m) => m.id === justCreated.id)) return prev;
          return [...prev, justCreated];
        });
      } else {
        // Workspace: replace with full refreshed list
        setMessages(data);
      }

      setMessage('');
      setNewMsgIds((s) => new Set([...s, justCreated.id]));
      setTimeout(() => {
        setNewMsgIds((s) => {
          const n = new Set(s);
          n.delete(justCreated.id);
          return n;
        });
      }, 600);

      inputRef.current?.focus();
      socket?.emit('new_message', { ...justCreated, roomId });
    } catch (err) {
      console.error('handleSend error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId) => {
    setDeletingId(msgId);
    try {
      const res = await fetch(deleteMessageUrl(msgId), { method: 'DELETE' });
      if (res.ok) {
        setMessages((p) => p.filter((m) => m.id !== msgId));
        socket?.emit('delete_message', { roomId, messageId: msgId });
      }
    } catch (err) {
      console.error(err);
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

  /* ── Typing label ── */
  const typingLabel = (() => {
    if (!typingUsers.length) return null;
    const names = typingUsers.map((uid) => {
      const found = messages.find((m) => m.user?.id === uid);
      return found?.user?.name ?? 'Someone';
    });
    if (names.length === 1) return `${names[0]} is typing`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
    return 'Several people are typing';
  })();

  const onlineCount = onlineUsers.filter(
    (id) => String(id) !== String(currentUserId)
  ).length;

  /* ── Group consecutive messages from same sender ── */
  const grouped = (messages ?? []).map((msg, i, arr) => {
    const prev = arr[i - 1];
    const showAvatar =
      !prev ||
      prev.user?.id !== msg.user?.id ||
      new Date(msg.createdAt) - new Date(prev.createdAt) > 5 * 60 * 1000;
    return { msg, showAvatar };
  });

  /* ── Empty / no room selected state ── */
  if (!roomId) {
    return (
      <div className="msg-panel">
        <div className="msg-panel__body">
          <div className="msg-panel__empty">
            <div className="msg-panel__empty-icon">
              {isDMMode ? '💬' : '🏠'}
            </div>
            <p className="msg-panel__empty-title">
              {isDMMode ? 'Select a conversation' : 'Select a channel'}
            </p>
            <p className="msg-panel__empty-sub">
              {isDMMode
                ? 'Pick someone from your messages'
                : 'Pick a channel from the sidebar'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Header label ── */
  const headerName = isDMMode
    ? (thread?.name ?? 'Direct Message')
    : (thread?.title ?? 'channel');

  return (
    <div className="msg-panel">
      {/* ── Header ── */}
      <div className="msg-panel__header">
        <div className="msg-panel__header-left">
          <div className="msg-panel__channel-icon">
            <FontAwesomeIcon icon={isDMMode ? faAt : faHashtag} />
          </div>
          <span className="msg-panel__channel-name">{headerName}</span>
          <span className="msg-panel__count">{messages?.length ?? 0}</span>

          {/* DM: show online indicator for the other person */}
          {isDMMode && onlineUsers.includes(thread?.userId) && (
            <span className="msg-panel__dm-online">
              <span className="msg-panel__dm-online-dot" /> Online
            </span>
          )}
        </div>
        {!isDMMode && onlineCount > 0 && (
          <div className="msg-panel__online">
            <span className="msg-panel__online-dot" />
            <span className="msg-panel__online-label">
              {onlineCount} online
            </span>
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="msg-panel__body scrollbar-thin">
        {grouped.length > 0 ? (
          grouped.map(({ msg, showAvatar }) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              isOwn={String(msg.user?.id) === String(currentUserId)}
              showAvatar={showAvatar}
              isDeleting={deletingId === msg.id}
              isNew={newMsgIds.has(msg.id)}
              isOnline={onlineUsers.some(
                (id) => String(id) === String(msg.user?.id)
              )}
              onDelete={
                String(msg.user?.id) === String(currentUserId)
                  ? () => handleDelete(msg.id)
                  : null
              }
            />
          ))
        ) : (
          <div className="msg-panel__empty">
            <div className="msg-panel__empty-icon">💬</div>
            <p className="msg-panel__empty-title">No messages yet</p>
            <p className="msg-panel__empty-sub">
              Be the first to say something
            </p>
          </div>
        )}

        {typingLabel && (
          <div className="msg-typing">
            <div className="msg-typing__dots">
              <span />
              <span />
              <span />
            </div>
            <span className="msg-typing__label">{typingLabel}…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="msg-panel__footer">
        <div className={`msg-input-wrap ${message.trim() ? 'is-active' : ''}`}>
          <button className="msg-input__attach" title="Attach">
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={message}
            placeholder={
              isDMMode ? `Message ${headerName}` : `Message #${headerName}`
            }
            onChange={(e) => handleTyping(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="msg-input__field"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className={`msg-input__send ${message.trim() && !sending ? 'is-ready' : ''}`}
            title="Send"
          >
            {sending ? (
              <span className="msg-input__send-spinner" />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} />
            )}
          </button>
        </div>
        <p className="msg-input__hint">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   MESSAGE ROW
────────────────────────────────────────────── */
function MessageRow({
  msg,
  isOwn,
  showAvatar,
  isDeleting,
  isNew,
  isOnline,
  onDelete,
}) {
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

  const gradient = getGradient(msg.user?.name || '');
  const initial = msg.user?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setConfirmDelete(false);
      }}
      className={[
        'msg-row',
        isOwn ? 'msg-row--own' : '',
        isDeleting ? 'msg-row--deleting' : '',
        isNew ? 'msg-row--new' : '',
        !showAvatar ? 'msg-row--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Avatar column */}
      <div className="msg-row__avatar-col">
        {showAvatar ? (
          <div className="msg-row__avatar-wrap">
            <div className="msg-row__avatar" style={{ background: gradient }}>
              {initial}
            </div>
            {isOnline && <span className="msg-row__online-dot" />}
          </div>
        ) : (
          <span className={`msg-row__time-peek ${hovered ? 'is-visible' : ''}`}>
            {formatTime(msg.createdAt)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="msg-row__content">
        {showAvatar && (
          <div className="msg-row__meta">
            <span
              className="msg-row__name"
              style={{
                background: gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {msg.user?.name ?? 'Unknown'}
            </span>
            <span className="msg-row__time">{formatTime(msg.createdAt)}</span>
          </div>
        )}

        <div className="msg-row__bubble-row">
          <div
            className={`msg-row__bubble ${isOwn ? 'msg-row__bubble--own' : ''}`}
          >
            {msg.content}
          </div>

          {isOwn && onDelete && (
            <div className={`msg-row__actions ${hovered ? 'is-visible' : ''}`}>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className={`msg-row__delete-btn ${confirmDelete ? 'is-confirm' : ''}`}
                title={
                  confirmDelete ? 'Click again to confirm' : 'Delete message'
                }
              >
                {isDeleting ? (
                  '…'
                ) : confirmDelete ? (
                  '✕ Sure?'
                ) : (
                  <FontAwesomeIcon icon={faTrash} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Message;
