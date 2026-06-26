'use client';

import { useCallback, useEffect, useRef } from 'react';
import { CircularProgress } from '@mui/material';
import { Paperclip, ArrowDown } from 'lucide-react';
import { formatDateHeader } from './utils/dateUtils';
import MessageBubble from './MessageBubble';
import MediaPreviewOverlay from './MediaPreviewOverlay';

export default function ChatMessagesArea({
  messages,
  loading,
  isDragOver,
  containerRef,
  messagesListRef,
  messagesEndRef,
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  mediaPreview,
  selectedPreviewIndex,
  setSelectedPreviewIndex,
  isSendingMedia,
  clearMediaPreview,
  removeMediaPreview,
  fileInputRef,
  showScrollToBottom,
  setShowScrollToBottom,
  unreadCount,
  setUnreadCount,
  scrollToBottom,
  baseAvatarConfig,
  messageReactions,
  loadedMedia,
  setLoadedMedia,
  mediaCache,
  setMediaViewer,
  reactionPickerMessageId,
  setReactionPickerMessageId,
  onContextMenuOpen,
  onReactionSelect,
  onExternalLinkClick,
  blinkMessageId,
  scrollToMessage,
  input,
  setInput,
  handleSend,
  sending,
  emojiPickerOpen,
  setEmojiPickerOpen,
  isLoadingMore,
  hasMore,
  loadMoreMessages,
}) {
  const groupMessagesByDate = useCallback(() => {
    const grouped = {};
    messages.forEach((msg) => {
      let date;
      const rawDate = msg?.DateTime || msg?.sentAt || msg?.sent_at || msg?.createdAt;
      if (rawDate) {
        const d = new Date(rawDate);
        date = d.toISOString().split('T')[0];
      } else {
        date = 'Unknown';
      }
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(msg);
    });
    return grouped;
  }, [messages]);

  // Track whether user is near bottom so we can auto-scroll when media loads
  const wasNearBottomRef = useRef(true);
  useEffect(() => {
    const el = messagesListRef.current;
    if (!el) return;
    const onScroll = () => {
      wasNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [messagesListRef]);

  // When any media finishes loading, keep the user at the bottom if they were already there
  useEffect(() => {
    const el = messagesListRef.current;
    if (!el) return;
    if (wasNearBottomRef.current) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [loadedMedia]);

  return (
    <div
      className={`chat-messages-area ${isDragOver ? 'drag-over' : ''} ${mediaPreview.length > 0 ? 'media-preview-open' : ''}`}
      ref={containerRef}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="drag-overlay">
          <div className="drag-overlay-content">
            <Paperclip size={40} />
            <span>Drop files here to send</span>
          </div>
        </div>
      )}

      <div
        className="chat-messages-list"
        ref={messagesListRef}
        onScroll={() => {
          const el = messagesListRef.current;
          if (!el || isLoadingMore || !hasMore || loading) return;
          const nearTop = el.scrollTop < 100;
          if (nearTop) {
            loadMoreMessages();
          }
        }}
      >
        {/* Skeleton placeholders at top while loading older messages */}
        {isLoadingMore && (
          <div className="chat-messages-loading-more" style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <CircularProgress size={18} thickness={4} sx={{ color: '#1daa61' }} />
            <span style={{ fontSize: 12, color: '#888' }}>Loading older messages...</span>
          </div>
        )}

        {/* Blur overlay + CircularProgress while loading initial conversation */}
        {loading && messages.length === 0 && (
          <div className="chat-messages-loading-overlay">
            <div className="chat-messages-loading-blur" />
            <div className="chat-messages-loading-content">
              <CircularProgress size={40} thickness={3.5} sx={{ color: '#3b82f6' }} />
              <span className="chat-messages-loading-text">Loading conversation...</span>
            </div>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="chat-empty-center">No messages yet. Start the conversation!</div>
        )}

        {Object.entries(groupMessagesByDate()).map(([date, dateMessages]) => (
          <div key={`group-${date}`}>
            {dateMessages.some((m) => m?.DateTime || m?.sentAt || m?.sent_at) && (
              <div className="message-date-header" key={`header-${date}`}>
                <span>{formatDateHeader(date)}</span>
              </div>
            )}

            {dateMessages.map((msg) => {
              const isOutgoing = msg?.direction === 1 || msg?.Direction === 1 || msg?.direction === '1';
              const messageId = msg?.id || msg?.Id || msg?.autoid || msg?.MessageId;
              return (
                <MessageBubble
                  key={messageId}
                  msg={msg}
                  messageId={messageId}
                  isOutgoing={isOutgoing}
                  baseAvatarConfig={baseAvatarConfig}
                  messageReactions={messageReactions}
                  loadedMedia={loadedMedia}
                  setLoadedMedia={setLoadedMedia}
                  mediaCache={mediaCache}
                  setMediaViewer={setMediaViewer}
                  reactionPickerMessageId={reactionPickerMessageId}
                  setReactionPickerMessageId={setReactionPickerMessageId}
                  onContextMenuOpen={onContextMenuOpen}
                  onReactionSelect={onReactionSelect}
                  onExternalLinkClick={onExternalLinkClick}
                  blinkMessageId={blinkMessageId}
                  scrollToMessage={scrollToMessage}
                />
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && messages.length > 0 && (
        <button
          className="scroll-to-bottom-btn"
          onClick={() => {
            scrollToBottom();
            setUnreadCount(0);
          }}
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={20} strokeWidth={2.5} />
          {unreadCount > 0 && (
            <span className="scroll-to-bottom-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>
      )}

      {/* WhatsApp-style media preview overlay */}
      {mediaPreview.length > 0 && (
        <MediaPreviewOverlay
          mediaPreview={mediaPreview}
          messages={messages}
          selectedPreviewIndex={selectedPreviewIndex}
          onSelectIndex={setSelectedPreviewIndex}
          isSendingMedia={isSendingMedia}
          onClear={clearMediaPreview}
          onRemove={removeMediaPreview}
          onAddMore={() => fileInputRef.current?.click()}
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          sending={sending}
          emojiPickerOpen={emojiPickerOpen}
          setEmojiPickerOpen={setEmojiPickerOpen}
        />
      )}
    </div>
  );
}
