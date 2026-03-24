'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';
import { faHashtag, faPaperPlane, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
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
const getGradient = (name = '') => GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];

const formatTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ──────────────────────────────────────────────
   MAIN MESSAGE COMPONENT
────────────────────────────────────────────── */
export const Message = ({ thread, messages, setMessages, onlineUsers = [] }) => {
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

  /* ── Socket ── */
  useEffect(() => {
    if (!socket || !thread?.id) return;
    socket.emit('join_thread', thread.id);

    socket.on('message_received', (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        setNewMsgIds((s) => new Set([...s, msg.id]));
        setTimeout(() => setNewMsgIds((s) => { const n = new Set(s); n.delete(msg.id); return n; }), 600);
        return [...prev, msg];
      });
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
      socket.emit('leave_thread', thread.id);
      socket.off('message_received');
      socket.off('message_deleted');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [socket, thread?.id]);

  /* ── Auto scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Handlers ── */
  const handleTyping = useCallback((v) => setMessage(v), []);
  const handleFocus  = useCallback(() => socket?.emit('typing_start', thread.id), [socket, thread?.id]);
  const handleBlur   = useCallback(() => socket?.emit('typing_stop',  thread.id), [socket, thread?.id]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    clearTimeout(typingTimeoutRef.current);
    socket?.emit('typing_stop', thread.id);
    setSending(true);
    try {
      const res = await fetch(`/api/threads/${thread.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });
      const newMessages = await res.json();
      const justCreated = newMessages[newMessages.length - 1];
      setNewMsgIds((s) => new Set([...s, justCreated.id]));
      setTimeout(() => setNewMsgIds((s) => { const n = new Set(s); n.delete(justCreated.id); return n; }), 600);
      setMessages(newMessages);
      setMessage('');
      inputRef.current?.focus();
      socket?.emit('new_message', justCreated);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId) => {
    setDeletingId(msgId);
    try {
      const res = await fetch(`/api/threads/${thread.id}/message/${msgId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages((p) => p.filter((m) => m.id !== msgId));
        socket?.emit('delete_message', { threadId: thread.id, messageId: msgId });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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

  const onlineCount = onlineUsers.filter((id) => String(id) !== String(currentUserId)).length;

  /* ── Group consecutive messages from same sender ── */
  const grouped = (messages ?? []).map((msg, i, arr) => {
    const prev = arr[i - 1];
    const showAvatar = !prev || prev.user?.id !== msg.user?.id ||
      new Date(msg.createdAt) - new Date(prev.createdAt) > 5 * 60 * 1000;
    return { msg, showAvatar };
  });

  return (
    <div className="msg-panel">
      {/* ── Header ── */}
      <div className="msg-panel__header">
        <div className="msg-panel__header-left">
          <div className="msg-panel__channel-icon">
            <FontAwesomeIcon icon={faHashtag} />
          </div>
          <span className="msg-panel__channel-name">{thread?.title || 'channel'}</span>
          <span className="msg-panel__count">{messages?.length ?? 0}</span>
        </div>
        {onlineCount > 0 && (
          <div className="msg-panel__online">
            <span className="msg-panel__online-dot" />
            <span className="msg-panel__online-label">{onlineCount} online</span>
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
              isOnline={onlineUsers.some((id) => String(id) === String(msg.user?.id))}
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
            <p className="msg-panel__empty-sub">Be the first to say something</p>
          </div>
        )}

        {/* Typing indicator */}
        {typingLabel && (
          <div className="msg-typing">
            <div className="msg-typing__dots">
              <span /><span /><span />
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
            placeholder={`Message #${thread?.title || 'channel'}`}
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
            {sending
              ? <span className="msg-input__send-spinner" />
              : <FontAwesomeIcon icon={faPaperPlane} />
            }
          </button>
        </div>
        <p className="msg-input__hint">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   MESSAGE ROW
────────────────────────────────────────────── */
function MessageRow({ msg, isOwn, showAvatar, isDeleting, isNew, isOnline, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = () => {
    if (confirmDelete) { onDelete(); setConfirmDelete(false); }
    else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }
  };

  const gradient = getGradient(msg.user?.name || '');
  const initial  = msg.user?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
      className={[
        'msg-row',
        isOwn      ? 'msg-row--own'      : '',
        isDeleting ? 'msg-row--deleting' : '',
        isNew      ? 'msg-row--new'      : '',
        !showAvatar ? 'msg-row--compact' : '',
      ].filter(Boolean).join(' ')}
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
            <span className="msg-row__name" style={{ background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {msg.user?.name ?? 'Unknown'}
            </span>
            <span className="msg-row__time">{formatTime(msg.createdAt)}</span>
          </div>
        )}

        <div className="msg-row__bubble-row">
          <div className={`msg-row__bubble ${isOwn ? 'msg-row__bubble--own' : ''}`}>
            {msg.content}
          </div>

          {/* Delete action */}
          {isOwn && onDelete && (
            <div className={`msg-row__actions ${hovered ? 'is-visible' : ''}`}>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className={`msg-row__delete-btn ${confirmDelete ? 'is-confirm' : ''}`}
                title={confirmDelete ? 'Click again to confirm' : 'Delete message'}
              >
                {isDeleting
                  ? '…'
                  : confirmDelete
                  ? '✕ Sure?'
                  : <FontAwesomeIcon icon={faTrash} />
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Message;