'use client';

import { useState, useRef, memo } from 'react';
import { Avatar, Skeleton, Tooltip, Box, Typography } from '@mui/material';
import { MoreVertical, ChevronDown, Paperclip, FileText, Download, AlertCircle } from 'lucide-react';
import DynamicTemplate from './DynamicTemplate';
import QuickReactionMenu from './QuickReactionMenu';
import { Emoji } from 'emoji-picker-react';
import { parseTemplateData, renderLinks } from './utils/chatUtils';

const charToUnified = (char) => {
  if (!char) return null;
  return Array.from(char)
    .map((c) => c.codePointAt(0).toString(16))
    .filter((hex) => hex !== 'fe0f')
    .join('-');
};

const imageDimsCache = new Map();

const calculateImageDimensions = (naturalWidth, naturalHeight) => {
  const MAX_W = 320;
  const MAX_H = 240;
  const MIN_W = 160;
  const MIN_H = 160;

  const ratio = naturalWidth / naturalHeight;
  let width = MAX_W;
  let height = Math.round(width / ratio);

  if (height > MAX_H) {
    height = MAX_H;
    width = Math.round(height * ratio);
  }

  if (width < MIN_W) {
    width = MIN_W;
    height = Math.round(width / ratio);
  }
  if (height < MIN_H) {
    height = MIN_H;
    width = Math.round(height * ratio);
  }
  if (height > MAX_H) height = MAX_H;
  if (width > MAX_W) width = MAX_W;

  return { width, height };
};

const MessageBubble = memo(function MessageBubble({
  msg,
  messageId,
  isOutgoing,
  baseAvatarConfig,
  messageReactions,
  loadedMedia,
  setLoadedMedia,
  setMediaViewer,
  reactionPickerMessageId,
  setReactionPickerMessageId,
  onContextMenuOpen,
  onReactionSelect,
  onExternalLinkClick,
  blinkMessageId,
  scrollToMessage,
}) {
  const msgType = msg?.type || msg?.MessageType || 'text';
  const imageSrc = msg?.mediaUrl || msg?.imageUrl || msg?.MediaUrl;
  const cachedDims = imageSrc ? imageDimsCache.get(imageSrc) : null;

  const [hovered, setHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageDims, setImageDims] = useState(cachedDims);
  const videoRef = useRef(null);

  const hasMedia = msgType === 'image' || msgType === 'video' || msg?.mediaUrl || msg?.imageUrl || msg?.documentUrl || msg?.MediaUrl;
  const replyData = msg?.ContextType === 2 ? msg?.ReplyContext || msg?.replyTo : null;
  const isPickerOpen = reactionPickerMessageId === messageId;
  const isBlinking = blinkMessageId === messageId;

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  return (
    <div
      className={`message-item ${isOutgoing ? 'user-message' : 'customer-message'} ${isBlinking ? 'blink-message' : ''} ${messageReactions[messageId] ? 'has-reaction' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-message-id={messageId}
    >
      {!isOutgoing && (
        <Avatar
          {...baseAvatarConfig}
          sx={{ ...baseAvatarConfig.sx, width: 28, height: 28, mr: 1, flexShrink: 0 }}
        />
      )}
      <div className="message-content">
        {/* Hover actions */}
        {(hovered || isPickerOpen) && (
          <div className={`message-actions ${isPickerOpen ? 'picker-open' : ''}`}>
            <QuickReactionMenu
              isOpen={isPickerOpen}
              onToggle={() => setReactionPickerMessageId((prev) => (prev === messageId ? null : messageId))}
              onSelect={(emoji) => onReactionSelect(messageId, emoji)}
            />
            {msgType !== 'template' && (
              <button
                className="menu-btn"
                onClick={(e) => onContextMenuOpen(e, msg)}
                title="More"
              >
                <MoreVertical size={18} />
              </button>
            )}
          </div>
        )}

        <div
          className={`message-bubble ${isOutgoing ? 'user' : 'customer'} ${msg?.isUploading ? 'uploading' : ''}`}
          onContextMenu={(e) => onContextMenuOpen(e, msg)}
        >
          {/* WhatsApp-like top-right menu icon */}
          {msgType !== 'template' && (
            <button
              className="message-top-right-btn"
              onClick={(e) => onContextMenuOpen(e, msg)}
              title="More"
            >
              <ChevronDown size={22} />
            </button>
          )}

          {/* Reply preview inside bubble */}
          {replyData && (
            <div
              className="message-reply-indicator"
              style={{ cursor: msg?.ContextId ? 'pointer' : 'default', opacity: msg?.ContextId ? 1 : 0.7 }}
              onClick={() => msg?.ContextId && scrollToMessage?.(msg.ContextId)}
            >
              <div className="reply-indicator-line" />
              <div className="reply-indicator-content">
                <div className="reply-indicator-sender">
                  {replyData.sender || replyData.Sender || 'Customer'}
                </div>
                <div className="reply-indicator-text">
                  {(replyData.text || replyData.Text || replyData.ReplyContextMsg || '').length > 50
                    ? `${(replyData.text || replyData.Text || replyData.ReplyContextMsg || '').substring(0, 50)}...`
                    : (replyData.text || replyData.Text || replyData.ReplyContextMsg || '')}
                </div>
              </div>
            </div>
          )}

          {/* Media */}
          {hasMedia && (
            <div className="message-media" style={(msgType === 'document' || msg?.documentUrl || msg?.DocumentUrl) || imageDims ? { minHeight: 'auto' } : {}}>
              {msgType === 'image' || msg?.imageUrl || msg?.mediaUrl || msg?.MediaUrl ? (
                <>
                  {!loadedMedia[messageId] && (
                    <Skeleton
                      variant="rectangular"
                      width={imageDims ? imageDims.width : '100%'}
                      height={imageDims ? imageDims.height : 240}
                      sx={{ borderRadius: '8px', position: 'absolute', top: 0, left: 0 }}
                    />
                  )}
                  <div
                    className="message-image-wrapper"
                    style={imageDims ? { width: imageDims.width, height: imageDims.height, maxWidth: '100%' } : { width: '100%', height: 240 }}
                    onClick={() =>
                      setMediaViewer({
                        open: true,
                        src: msg?.mediaUrl || msg?.imageUrl || msg?.MediaUrl,
                        filename: msg?.content || msg?.Message || 'image',
                        type: 'image',
                      })
                    }
                  >
                    <img
                      src={msg?.mediaUrl || msg?.imageUrl || msg?.MediaUrl}
                      alt="media"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, opacity: loadedMedia[messageId] ? 1 : 0, transition: 'opacity 0.3s ease' }}
                      onLoad={(e) => {
                        const w = e?.target?.naturalWidth || 0;
                        const h = e?.target?.naturalHeight || 0;
                        if (w > 0 && h > 0) {
                          const dims = calculateImageDimensions(w, h);
                          setImageDims(dims);
                          if (imageSrc) imageDimsCache.set(imageSrc, dims);
                        }
                        setLoadedMedia((prev) => ({ ...prev, [messageId]: true }));
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        setLoadedMedia((prev) => ({ ...prev, [messageId]: true }));
                      }}
                    />
                  </div>
                </>
              ) : msgType === 'video' || (msg?.mediaUrl && msg?.mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i)) ? (
                <div
                  className="message-video-wrapper"
                >
                  {!loadedMedia[messageId] && (
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={240}
                      sx={{ borderRadius: '8px', position: 'absolute', top: 0, left: 0 }}
                    />
                  )}
                  <div
                    className="message-video-inner"
                    onClick={() => {
                      if (videoRef.current) {
                        if (videoRef.current.paused) {
                          videoRef.current.play();
                        } else {
                          videoRef.current.pause();
                        }
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current) videoRef.current.pause();
                      setMediaViewer({
                        open: true,
                        src: msg?.mediaUrl || msg?.videoUrl,
                        filename: msg?.content || msg?.Message || 'video',
                        type: 'video',
                      });
                    }}
                  >
                    <video
                      ref={videoRef}
                      src={msg?.mediaUrl || msg?.videoUrl}
                      onLoadedData={() => setLoadedMedia((prev) => ({ ...prev, [messageId]: true }))}
                      onError={() => setLoadedMedia((prev) => ({ ...prev, [messageId]: true }))}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 8,
                        opacity: loadedMedia[messageId] ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                      }}
                    />
                    {/* Play overlay */}
                    {!isPlaying && loadedMedia[messageId] && (
                      <div className="video-play-overlay">
                        <div className="video-play-btn">
                          <div className="video-play-triangle" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : msg?.documentUrl || msg?.DocumentUrl || msg?.fileName ? (
                <DocumentCard
                  msg={msg}
                  setMediaViewer={setMediaViewer}
                />
              ) : (
                <div className="message-doc">
                  <Paperclip size={18} />
                  <span>{msg?.content || msg?.Message || msg?.fileName || 'Document'}</span>
                </div>
              )}
              {msg?.isUploading && msg?.percent !== undefined && (
                <UploadProgressOverlay percent={msg.percent} />
              )}
            </div>
          )}

          {/* Text (skip for template messages) */}
          {msgType !== 'template' && (msg?.content || msg?.message || msg?.text || msg?.Message) && (
            <div className="message-text">
              {renderLinks(
                msg?.content || msg?.message || msg?.text || msg?.Message,
                { onLinkClick: onExternalLinkClick }
              )}
            </div>
          )}

          {/* Template card */}
          {(() => {
            const tData = parseTemplateData(msg);
            if (!tData.isTemplate) return null;
            return (
              <DynamicTemplate
                templateName={tData.templateName}
                params={tData.params}
                language={tData.language}
                components={tData.components}
              />
            );
          })()}

          <div className="message-meta">
            <span className="message-time">
              {msg?.dateTime ||
                (msg?.DateTime &&
                  new Date(msg.DateTime).toLocaleTimeString('en-GB', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })) ||
                new Date(msg?.sentAt || msg?.sent_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
            </span>
            <MessageStatusIcon msg={msg} />
          </div>

          {/* Sender info for outgoing messages */}
          {isOutgoing && msg?.SenderInfo && (
            <div className="message-sender-info">@{msg.SenderInfo}</div>
          )}

          {/* Reaction display */}
          {messageReactions[messageId] && (
            <div className="message-reaction-badge">
              {(() => {
                const unified = charToUnified(messageReactions[messageId]);
                if (unified) {
                  return <Emoji unified={unified} size={18} emojiStyle="apple" />;
                }
                return messageReactions[messageId];
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

/* Document Card */
function DocumentCard({ msg, setMediaViewer }) {
  const fileName = msg?.fileName || msg?.content || msg?.Message || 'Document';
  const ext = (fileName.split('.').pop() || '').toUpperCase();
  const href = msg?.documentUrl || msg?.DocumentUrl || msg?.mediaUrl;

  const isExcel = ['XLS', 'XLSX', 'CSV'].includes(ext);
  const isWord = ['DOC', 'DOCX'].includes(ext);
  const isPdf = ext === 'PDF';

  const Icon = FileText;
  const iconColor = isExcel ? '#217346' : isWord ? '#2B579A' : isPdf ? '#F40F02' : '#666';

  return (
    <div
      className="message-document-card"
      onClick={() =>
        href &&
        setMediaViewer({
          open: true,
          src: href,
          filename: fileName,
          type: 'document',
        })
      }
    >
      <div className="message-document-icon" style={{ backgroundColor: `${iconColor}18`, color: iconColor }}>
        <Icon size={22} />
      </div>
      <div className="message-document-info">
        <div className="message-document-name" title={fileName}>
          {fileName}
        </div>
        <div className="message-document-ext">{ext || 'FILE'}</div>
      </div>
      <a
        className="message-document-download"
        href={href}
        download
        title="Download"
        onClick={(e) => {
          e.stopPropagation();
          if (!href) e.preventDefault();
        }}
      >
        <Download size={18} />
      </a>
    </div>
  );
}

/* Upload progress overlay */
function UploadProgressOverlay({ percent, size = 48 }) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="upload-progress-overlay">
      <div className="upload-progress-ring">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={(size - 6) / 2}
            fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={4}
          />
          <circle
            cx={size / 2} cy={size / 2} r={(size - 6) / 2}
            fill="none" stroke="#fff" strokeWidth={4}
            strokeDasharray={`${2 * Math.PI * (size - 6) / 2}`}
            strokeDashoffset={`${2 * Math.PI * (size - 6) / 2 * (1 - safe / 100)}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <span className="upload-progress-text">{Math.round(safe)}%</span>
      </div>
    </div>
  );
}

/* Per-message status icon with failed tooltip */
function MessageStatusIcon({ msg }) {
  const status = typeof msg?.Status === 'number' ? msg.Status : (msg?.status === 'pending' || msg?.isUploading ? 0 : -1);

  if (msg?.direction !== 1 && msg?.Direction !== 1) return null;

  if (status === 4 || msg?.status === 'failed') {
    let errorTitle = 'Message Failed';
    let errorDetails = '';
    try {
      if (msg?.FailedReason || msg?.FailedReson) {
        const parsed = JSON.parse(msg?.FailedReason || msg?.FailedReson);
        errorTitle = parsed.title || parsed.message || 'Message Failed';
        errorDetails = parsed.error_data?.details || parsed.details || '';
      }
    } catch (e) {
      errorTitle = msg?.FailedReason || msg?.FailedReson || 'Message failed to deliver';
    }

    return (
      <Tooltip
        title={
          <Box sx={{ p: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>
              {errorTitle}
            </Typography>
            {errorDetails && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontStyle: 'italic' }}>
                {errorDetails}
              </Typography>
            )}
          </Box>
        }
        arrow
        placement="top"
      >
        <span className="message-status" style={{ color: '#ff4444', display: 'inline-flex', alignItems: 'center' }}>
          <AlertCircle size={14} />
        </span>
      </Tooltip>
    );
  }

  if (status === 0 || msg?.isUploading || msg?.status === 'pending') {
    return (
      <span className="message-status" style={{ color: '#9e9e9e' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </span>
    );
  }

  if (status === 3) {
    return (
      <span className="message-status" style={{ color: '#1F51FF' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" /><polyline points="20 6 9 17 4 12" transform="translate(2, 0)" />
        </svg>
      </span>
    );
  }

  if (status === 2) {
    return (
      <span className="message-status" style={{ color: '#9e9e9e' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" /><polyline points="20 6 9 17 4 12" transform="translate(2, 0)" />
        </svg>
      </span>
    );
  }

  if (status === 1) {
    return (
      <span className="message-status" style={{ color: '#9e9e9e' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }

  return null;
}

export default MessageBubble;
