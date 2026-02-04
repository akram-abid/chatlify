'use client';

import { useEffect, useState } from 'react';
import Contacts from '@/components/Contacts';
import Navrow from '../components/navrow';
import Message from '@/components/Message';

export default function Home() {
  const [Ws, SetWs] = useState([]);
  const [Sections, SetSections] = useState([]);
  const [SelectedThread, SetSelctedThread] = useState({});
  const [Messages, SetMessages] = useState([]);

  useEffect(() => {
    console.log('the secions are: ', Sections);
  }, [Sections]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/workspaces/');
        const data = await res.json();
        SetWs(data.workspaces);
      } catch (err) {
        console.error(err);
      }
    };

    fetchWorkspaces();
  }, []);

  useEffect(() => {
    console.log('the thread is: ', SelectedThread);

    const fetchMessges = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/threads/${SelectedThread.id}/message`
        );
        const data = await res.json();
        SetMessages(data);
        console.log('the messages are: ', data);  
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessges();
  }, [SelectedThread]);

  return (
    <div className="grid grid-cols-[70px_300px_1fr] h-screen dark">
      <Navrow workspaces={Ws} updateSections={SetSections} />
      <Contacts sections={Sections} updateSelectedThred={SetSelctedThread} />
      <Message thread={SelectedThread} messages={Messages} />
    </div>
  );
}
