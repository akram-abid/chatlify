'use client';

import { useEffect, useState } from 'react';
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

  // DM state
  const [isDMMode, setIsDMMode] = useState(false);
  const [dmConversations, setDmConversations] = useState([]);
  const [selectedDM, setSelectedDM] = useState(null);

  const { token, currentUserId } = useAuth();
  const socket = useSocket(token);

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
        SetWs(data.workspaces);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWorkspaces();
  }, []);

  // ── Fetch DM conversations when entering DM mode ──
  useEffect(() => {
    if (!isDMMode) return;
    const fetchDMs = async () => {
      try {
        const res = await fetch('/api/dm/conversations');
        const data = await res.json();
        setDmConversations(data.conversations || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDMs();
  }, [isDMMode]);

  // ── Fetch messages for selected thread ──
  useEffect(() => {
    if (!SelectedThread?.id) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/threads/${SelectedThread.id}/message`);
        const data = await res.json();
        SetMessages(data);
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
        SetMessages(data.messages || []);
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

  const handleToggleDM = (val) => {
    setIsDMMode(val);
    // clear active thread when switching modes
    SetSelectedThread({});
    setSelectedDM(null);
    SetMessages([]);
  };

  // what to pass as "thread" to Message panel
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
          onlineUsers={onlineUsers}
          selectedDM={selectedDM}
          onSelectDM={setSelectedDM}
        />
        <Message
          thread={activeConversation}
          messages={Messages}
          setMessages={SetMessages}
          onlineUsers={onlineUsers}
          isDMMode={isDMMode}
        />
      </div>
    </div>
  );
}