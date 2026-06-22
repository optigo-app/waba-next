'use client';

import { IconButton, CircularProgress, Tooltip } from '@mui/material';
import { Paperclip, Smile, Send } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import ReplyPreview from './ReplyPreview';

export default function ChatInputArea({
  replyToMessage,
  setReplyToMessage,
  fileInputRef,
  uploading,
  handleFileUpload,
  input,
  setInput,
  handleSend,
  sending,
  mediaPreviewLength,
  emojiPickerOpen,
  setEmojiPickerOpen,
  emojiPickerRef,
  addMediaFiles,
}) {
  return (
    <div className="chat-input-area">
        {/* Reply-to preview */}
        {replyToMessage && (
          <ReplyPreview
            message={replyToMessage}
            onCancel={() => setReplyToMessage(null)}
          />
        )}

        <div className="chat-input-container">
          <Tooltip title="Attach file">
            <IconButton
              size="small"
              className="chat-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <CircularProgress size={18} /> : <Paperclip size={18} />}
            </IconButton>
          </Tooltip>
          <input
            type="text"
            className="chat-text-input"
            placeholder={
              replyToMessage
                ? 'Type a reply...'
                : mediaPreviewLength > 0
                ? 'Add a caption...'
                : 'Type a message...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onPaste={(e) => {
              const clipboardData = e.clipboardData || window.clipboardData;
              const files = clipboardData?.files;
              if (files && files.length > 0) {
                e.preventDefault();
                addMediaFiles(files);
              }
            }}
          />
          <div style={{ position: 'relative' }} ref={emojiPickerRef}>
            <Tooltip title="Emoji">
              <IconButton
                size="small"
                className="chat-emoji-btn"
                onClick={() => setEmojiPickerOpen((prev) => !prev)}
              >
                <Smile size={20} />
              </IconButton>
            </Tooltip>
            {emojiPickerOpen && (
              <div className="emoji-picker-dropdown">
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setInput((prev) => prev + emojiData.emoji);
                  }}
                  width={300}
                  height={380}
                  skinTonesDisabled
                />
              </div>
            )}
          </div>
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={sending || (!input.trim() && mediaPreviewLength === 0)}
          >
            {sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Send size={18} />}
          </button>
        </div>
    </div>
  );
}
