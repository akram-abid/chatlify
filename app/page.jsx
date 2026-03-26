'use client';

import { useEffect, useRef, useState } from 'react';
import Contacts from '@/components/Contacts';
import Navrow from '../components/navrow';
import Message from '@/components/Message';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [Ws, SetWs] = useState([]);
  const [Sections, SetSections] = useState([]);
  const [SelectedThread, SetSelectedThread] = useState({});
  const [Messages, SetMessages] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [globalOnlineUsers, setGlobalOnlineUsers] = useState([]);

  // DM state
  const [isDMMode, setIsDMMode] = useState(false);
  const [dmConversations, setDmConversations] = useState([]);
  const [selectedDM, setSelectedDM] = useState(null);
  const [unreadDMs, setUnreadDMs] = useState({});
  const selectedDMRef = useRef(null);

  const { token, currentUserId } = useAuth();
  const socket = useSocket(token);

  useEffect(() => {
    selectedDMRef.current = selectedDM;
  }, [selectedDM]);

  // ── Global presence ──
  useEffect(() => {
    if (!socket) return;
    socket.on('global_online_users', (ids) => setGlobalOnlineUsers(ids));
    socket.on('global_user_online', (id) =>
      setGlobalOnlineUsers((p) => (p.includes(id) ? p : [...p, id]))
    );
    socket.on('global_user_offline', (id) =>
      setGlobalOnlineUsers((p) => p.filter((x) => x !== id))
    );
    return () => {
      socket.off('global_online_users');
      socket.off('global_user_online');
      socket.off('global_user_offline');
    };
  }, [socket]);

  // ── Workspace presence ──
  useEffect(() => {
    if (!socket || !selectedWorkspaceId) return;
    socket.emit('join_workspace', selectedWorkspaceId);
    socket.on('online_users', setOnlineUsers);
    socket.on('user_online', (id) =>
      setOnlineUsers((p) => (p.includes(id) ? p : [...p, id]))
    );
    socket.on('user_offline', (id) =>
      setOnlineUsers((p) => p.filter((x) => x !== id))
    );
    return () => {
      socket.emit('leave_workspace', selectedWorkspaceId);
      socket.off('online_users');
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [socket, selectedWorkspaceId]);

  // ── Fetch workspaces ──
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('/api/workspaces/');
        const data = await res.json();
        SetWs(data.workspaces ?? []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWorkspaces();
  }, []);

  // ── Fetch DM conversations ──
  useEffect(() => {
    const fetchDMs = async () => {
      try {
        const res = await fetch('/api/dm/conversations');
        const data = await res.json();
        setDmConversations(data.conversations ?? []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDMs();
  }, []);
  useEffect(() => {
    if (!socket || dmConversations.length === 0) return;
    dmConversations.forEach((conv) =>
      socket.emit('join_conversation', conv.id)
    );
  }, [socket, dmConversations]);

  // ── Real-time DM preview + unread — listens to dm_message_received ──
  // This fires for ALL incoming DMs regardless of which conversation is open.
  // The sender's own messages come through here too because Message.jsx
  // emits new_dm_message → server broadcasts dm_message_received to the dm: room
  // → page.jsx catches it here to update the sidebar preview.
  useEffect(() => {
    if (!socket) return;

    const handleDMMessage = (msg) => {
      const conversationId = msg.dmRoomId;
      if (!conversationId) return;

      const time = new Date(msg.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      setDmConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                lastMessage: msg.content,
                lastTime: time,
                lastMessageId: msg.id,
              } // ← add this
            : conv
        );
        return updated.sort((a, b) =>
          a.id === conversationId ? -1 : b.id === conversationId ? 1 : 0
        );
      });

      // Read selectedDM from ref — no nested setState
      if (
        selectedDMRef.current?.id !== conversationId &&
        String(msg.user?.id) !== String(currentUserId)
      ) {
        setUnreadDMs((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }
    };

    const handleDMDelete = ({ conversationId, messageId }) => {
      setDmConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, lastMessage: 'Message deleted', lastMessageId: null }
            : conv
        )
      );
    };

    socket.on('dm_message_received', handleDMMessage);
    socket.on('dm_message_deleted', handleDMDelete);
    return () => {
      socket.off('dm_message_received', handleDMMessage);
      socket.off('dm_message_deleted', handleDMDelete);
    };
  }, [socket, currentUserId]);

  // ── Fetch messages for selected thread ──
  useEffect(() => {
    if (!SelectedThread?.id) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/threads/${SelectedThread.id}/message`);
        const data = await res.json();
        SetMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
  }, [SelectedThread]);

  // ── Fetch messages for selected DM ──
  useEffect(() => {
    if (!selectedDM?.id) return;
    const fetchDMMessages = async () => {
      try {
        const res = await fetch(`/api/dm/${selectedDM.id}/messages`);
        const data = await res.json();
        SetMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDMMessages();
  }, [selectedDM]);

  const handleSelectWorkspace = (workspace) => {
    setSelectedWorkspaceId(workspace.id);
    SetSelectedThread({});
    SetMessages([]);
    setOnlineUsers([]);
  };

  const handleSelectDM = (dm) => {
    setSelectedDM(dm);
    setUnreadDMs((prev) => ({ ...prev, [dm.id]: 0 }));
  };

  const handleToggleDM = (val) => {
    setIsDMMode(val);
    SetSelectedThread({});
    setSelectedDM(null);
    SetMessages([]);
  };

  const activeConversation = isDMMode ? selectedDM : SelectedThread;

  return (
    <div className="chatlify-root dark">
      <div className="glow-blob glow-blob--cyan" />
      <div className="glow-blob glow-blob--purple" />
      <div className="glow-blob glow-blob--teal" />

      <div className="chatlify-grid">
        <Navrow
          workspaces={Ws}
          updateSections={SetSections}
          onSelectWorkspace={handleSelectWorkspace}
          selectedWorkspaceId={selectedWorkspaceId}
          onToggleDM={handleToggleDM}
          isDMMode={isDMMode}
        />
        <Contacts
          sections={Sections}
          updateSelectedThred={SetSelectedThread}
          selectedThread={SelectedThread}
          isDMMode={isDMMode}
          dmConversations={dmConversations}
          onlineUsers={globalOnlineUsers}
          selectedDM={selectedDM}
          onSelectDM={handleSelectDM}
          unreadDMs={unreadDMs}
          messages={Messages}
        />
        <Message
          thread={activeConversation}
          messages={Messages}
          setMessages={SetMessages}
          onlineUsers={isDMMode ? globalOnlineUsers : onlineUsers}
          isDMMode={isDMMode}
        />
      </div>
    </div>
  );
}
