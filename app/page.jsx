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
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null); // ← added
  const [onlineUsers, setOnlineUsers] = useState([]);                   // ← added

  const { token, currentUserId } = useAuth(); // ← get currentUserId from context, no need to fetch again
  const socket = useSocket(token);

  // ── Workspace presence ──
  useEffect(() => {
    if (!socket || !selectedWorkspaceId) return;

    socket.emit('join_workspace', selectedWorkspaceId);

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
    });

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

  // ── Fetch messages when thread changes ──
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

  // ── When user picks a workspace in Navrow ──
  const handleSelectWorkspace = (workspace) => {
    setSelectedWorkspaceId(workspace.id);
    //SetSections([]); // clear sections
    SetSelectedThread({});  // clear thread
    SetMessages([]);        // clear messages
    setOnlineUsers([]);     // reset online users
  };

  return (
    <div className="grid grid-cols-[70px_300px_1fr] h-screen dark">
      <Navrow
        workspaces={Ws}
        updateSections={SetSections}
        onSelectWorkspace={handleSelectWorkspace} // ← pass this down
      />
      <Contacts
        sections={Sections}
        updateSelectedThred={SetSelectedThread}
      />
      <Message
        thread={SelectedThread}
        messages={Messages}
        setMessages={SetMessages}
        onlineUsers={onlineUsers} // ← pass down
      />
    </div>
  );
}