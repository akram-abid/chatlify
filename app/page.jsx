'use client';

import { useEffect, useState } from 'react';
import Contacts from '@/components/Contacts';
import Navrow from '../components/navrow';

export default function Home() {
  const [Ws, SetWs] = useState({});
  useEffect(() => {
    const fetchWorkspaces = async () => {
      const res = await fetch('http://localhost:3001/api/workspaces/');
      const data = await res.json();
      console.log('the data is: ', data);
      SetWs(data.workspaces);
    };

    fetchWorkspaces();
    console.log('The wss are: ', Ws);
  }, []);

  return (
    <div className="grid grid-cols-[70px_300px_1fr] h-screen dark">
      <Navrow workspaces={Ws} />
      <Contacts />
      <div className="bg-blue-900">conversation</div>
    </div>
  );
}
