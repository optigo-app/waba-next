'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import ChatSidebar from './ChatSidebar';
import ChatConversation from './ChatConversation';
import './styles/global-chat.css';
import './styles/chat-page.css';
import './styles/chat-sidebar.css';
import './styles/ChatLayout.scss';
import './styles/ChatBubble.scss';
import './styles/ChatOverlays.scss';

export default function ChatPage() {
  const pathname = usePathname();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [converList, setConvList] = useState([]);
  const [isConversationRead, setIsConversationRead] = useState(false);
  const [viewConversationRead, setViewConversationRead] = useState(false);

  const handleCustomerSelect = useCallback((customer) => {
    setSelectedCustomer(customer);
    setIsConversationRead(false);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  const handleConversationRead = useCallback((isRead) => {
    setIsConversationRead(isRead);
  }, []);

  const handleConversationList = useCallback((list) => {
    setConvList(list);
  }, []);

  const handleViewConversationRead = useCallback((isRead) => {
    setViewConversationRead(isRead);
  }, []);

  const isAddConversation = pathname === '/chat/add-conversation';

  return (
    <div className="chat-page-container">
      <div className={`chat-page-layout${selectedCustomer ? ' chat-active' : ''}`}>
        {/* Left sidebar: conversation list */}
        <div className="chat-sidebar-section">
          <ChatSidebar
            onCustomerSelect={handleCustomerSelect}
            selectedCustomer={selectedCustomer}
            isConversationRead={isConversationRead}
            viewConversationRead={viewConversationRead}
            onConversationList={handleConversationList}
            isAddConversation={isAddConversation}
          />
        </div>

        {/* Right: conversation area */}
        <div className="chat-conversation-section">
          <ChatConversation
            selectedCustomer={selectedCustomer}
            onConversationRead={handleConversationRead}
            onViewConversationRead={handleViewConversationRead}
            onCustomerSelect={handleCustomerSelect}
            onBack={handleBackToList}
            converList={converList}
            isConversationRead={isConversationRead}
            setIsConversationRead={setIsConversationRead}
          />
        </div>
      </div>
    </div>
  );
}
