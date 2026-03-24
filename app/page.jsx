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

  const { token, currentUserId } = useAuth();
  const socket = useSocket(token);

  useEffect(() => {
    if (!socket || !selectedWorkspaceId) return;
    socket.emit('join_workspace', selectedWorkspaceId);
    socket.on('online_users', (userIds) => setOnlineUsers(userIds));
    socket.on('user_online', (userId) =>
      setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]))
    );
    socket.on('user_offline', (userId) =>
      setOnlineUsers((prev) => prev.filter((id) => id !== userId))
    );
    return () => {
      socket.emit('leave_workspace', selectedWorkspaceId);
      socket.off('online_users');
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [socket, selectedWorkspaceId]);

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

  const handleSelectWorkspace = (workspace) => {
    setSelectedWorkspaceId(workspace.id);
    SetSelectedThread({});
    SetMessages([]);
    setOnlineUsers([]);
  };

  return (
    <div className="chatlify-root dark">
      {/* Ambient glow blobs */}
      <div className="glow-blob glow-blob--cyan" />
      <div className="glow-blob glow-blob--purple" />
      <div className="glow-blob glow-blob--teal" />

      <div className="chatlify-grid">
        <Navrow
          workspaces={Ws}
          updateSections={SetSections}
          onSelectWorkspace={handleSelectWorkspace}
          selectedWorkspaceId={selectedWorkspaceId}
        />
        <Contacts
          sections={Sections}
          updateSelectedThred={SetSelectedThread}
          selectedThread={SelectedThread}
        />
        <Message
          thread={SelectedThread}
          messages={Messages}
          setMessages={SetMessages}
          onlineUsers={onlineUsers}
        />
      </div>
    </div>
  );
}