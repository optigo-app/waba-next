'use client';

import dynamic from 'next/dynamic';

const ChatPage = dynamic(() => import('../components/Chat/ChatPage'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5'
    }}>
      <span style={{ color: '#666', fontSize: '0.9rem' }}>Loading chat...</span>
    </div>
  ),
});

export default function ChatRoute() {
  return <ChatPage />;
}
