import React from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ChatArea } from './components/layout/ChatArea';
import { useSocket } from './hooks/useSocket';

export default function App() {
  // Connects socket and wires all event listeners
  useSocket();

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg-base)',
      }}
    >
      <Sidebar />
      <ChatArea />
    </div>
  );
}
