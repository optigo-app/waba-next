'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CircularProgress, Tooltip, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Check, CheckCheck, Clock3, AlertCircle,
} from 'lucide-react';
import { getCustomerDisplayName, getCustomerAvatarSeed, getWhatsAppAvatarConfig } from './utils/chatUtils';
import { fetchConversationView, sendChatText, sendChatMedia, sendReplyMessage, sendForwardMessage, fetchCustomerTags, fetchAgentLists } from '../../api/chat/conversationApi';
import ChatHeader from './ChatHeader';
import ChatMessagesArea from './ChatMessagesArea';
import ChatInputArea from './ChatInputArea';
import MessageContextMenu from './MessageContextMenu';
import ForwardMessageModal from './ForwardMessageModal';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { addMessageHandler, emitReaction, addMessageReactionHandler } from '../../socket';
import TagsModal from './TagsModal';
import CustomerDetails from './CustomerDetails';
import MediaViewer from './MediaViewer';
import RedirectionModal from './RedirectionModal';
import toast from 'react-hot-toast';

export default function ChatConversation({
  selectedCustomer,
  onConversationRead,
  onViewConversationRead,
  onCustomerSelect,
  onBack,
  converList,
  isConversationRead,
  setIsConversationRead,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(''); 
  const [sending, setSending] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaViewer, setMediaViewer] = useState({ open: false, src: '', filename: '', type: '', mediaItems: null, initialIndex: 0 });
  const [tagsList, setTagsList] = useState([]);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastMessageCountRef = useRef(0);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef(null);
  const [loadedMedia, setLoadedMedia] = useState({});
  const [forwardMessage, setForwardMessage] = useState(null);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [redirectModal, setRedirectModal] = useState({ open: false, url: '' });
  const [blinkMessageId, setBlinkMessageId] = useState(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});
  const [assigneeList, setAssigneeList] = useState([]);
  const [escalatedList, setEscalatedList] = useState([]);
  const [tagsMenuAnchorEl, setTagsMenuAnchorEl] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const can = useAuthStore((s) => s.can);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTabletOrMobile = useMediaQuery('(max-width:1000px)');

  const checkScroll = useCallback(() => {
    const el = tagsScrollRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }
  }, []);

  const handleScrollTags = useCallback((direction) => {
    const el = tagsScrollRef.current;
    if (el) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const el = tagsScrollRef.current;
    if (el && !isMobile) {
      el.addEventListener('scroll', checkScroll);
      checkScroll();

      if (typeof window !== 'undefined' && window.ResizeObserver) {
        const observer = new ResizeObserver(checkScroll);
        observer.observe(el);
        return () => {
          el.removeEventListener('scroll', checkScroll);
          observer.disconnect();
        };
      }
      return () => {
        el.removeEventListener('scroll', checkScroll);
      };
    }
  }, [tagsList, isMobile, checkScroll]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const messagesListRef = useRef(null);
  const tagsScrollRef = useRef(null);
  const dragCounterRef = useRef(0);
  const isPrependingRef = useRef(false);
  const { auth } = useAuth();

  const conversationId = selectedCustomer?.ConversationId ?? selectedCustomer?.Id ?? selectedCustomer?.autoid;

  // Refs for debounce / abort controller pattern (matches original waba-chat)
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const latestRequestRef = useRef(0);
  const onConversationReadRef = useRef(onConversationRead);
  onConversationReadRef.current = onConversationRead;

  // Unified effect for conversation switching with debouncing
  useEffect(() => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!conversationId) {
      setMessages([]);
      return;
    }

    // Debounce to prevent rapid clicks / StrictMode double-fire
    debounceTimerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const requestId = ++latestRequestRef.current;

      const load = async () => {
        setLoading(true);
        setIsLoadingMore(false);
        setPage(1);
        setHasMore(true);
        setMessages([]);
        setTagsList([]);
        setAssigneeList([]);
        setEscalatedList([]);
        setReplyToMessage(null);
        setLoadedMedia({});
        setUnreadCount(0);
        setForwardMessage(null);
        setMediaPreview([]);
        setReactionPickerMessageId(null);
        setMessageReactions({});

        try {
          const response = await fetchConversationView(conversationId, 1, 30, auth?.userId, controller.signal);
          if (controller.signal.aborted) return;

          let list = response?.data?.rd || [];
          list = [...list].sort((a, b) => {
            const getTime = (m) => new Date(m?.DateTime || m?.sentAt || m?.sent_at || 0).getTime();
            return getTime(a) - getTime(b);
          });
          if (requestId === latestRequestRef.current) {
            setMessages(list);
            setHasMore(response?.hasMore ?? (list.length === 30));
            setPage(1);
          }

          // Fetch customer tags
          if (selectedCustomer?.CustomerId && !controller.signal.aborted) {
            try {
              const tagsResponse = await fetchCustomerTags(selectedCustomer.CustomerId, auth?.userId, controller.signal);
              if (tagsResponse?.rd && requestId === latestRequestRef.current) {
                setTagsList(tagsResponse.rd);
              }
            } catch (tagErr) {
              // ignore tag fetch errors
            }
          }

          // Fetch agent lists (assignee + escalated share same API)
          if (auth?.userId && !controller.signal.aborted) {
            try {
              const agentResponse = await fetchAgentLists(auth?.userId, controller.signal);
              if (agentResponse?.rd && requestId === latestRequestRef.current) {
                setAssigneeList(agentResponse.rd);
              }
              if (agentResponse?.rd1 && requestId === latestRequestRef.current) {
                setEscalatedList(agentResponse.rd1);
              }
            } catch (agentErr) {
              // ignore agent fetch errors
            }
          }

          onConversationReadRef.current?.(true);
        } catch (err) {
          if (err.message === 'AbortError' || err.name === 'AbortError') {
            return;
          }
          console.error('Failed to load messages:', err);
        } finally {
          if (requestId === latestRequestRef.current) {
            setLoading(false);
          }
        }
      };

      load();
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [conversationId, auth?.userId, selectedCustomer?.autoid]);

  useEffect(() => {
    if (isPrependingRef.current) {
      isPrependingRef.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for real-time incoming messages via socket
  useEffect(() => {
    if (!conversationId) return;

    const removeHandler = addMessageHandler((data) => {
      const msgConversationId = data?.conversationId || data?.customerId || data?.autoid;
      const currentId = conversationId;
      if (String(msgConversationId) === String(currentId)) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some((m) => m.id === data.id || m.autoid === data.autoid);
          if (exists) return prev;
          return [...prev, data];
        });
      }
    });

    return () => removeHandler();
  }, [conversationId]);

  // Media preview helpers (must be before handleSend)
  const ALLOWED_EXTS = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.xls', '.xlsx'];
  const isFileAllowed = (file) => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) return true;
    const allowedMime = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    if (allowedMime.includes(file.type)) return true;
    const name = file.name.toLowerCase();
    return ALLOWED_EXTS.some((ext) => name.endsWith(ext));
  };

  const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16 MB
  const MAX_FILES_COUNT = 10;

  const addMediaFiles = useCallback((files) => {
    if (!files?.length) return;
    const fileArray = Array.from(files);

    // Check disallowed types
    const disallowed = fileArray.filter((f) => !isFileAllowed(f));
    if (disallowed.length > 0) {
      toast.error(`Ignored unsupported file(s): ${disallowed.map((f) => f.name).join(', ')}`);
    }

    let validFiles = fileArray.filter(isFileAllowed);

    // Check file size
    const oversized = validFiles.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error(`Ignored oversized file(s) (>16 MB): ${oversized.map((f) => f.name).join(', ')}`);
      validFiles = validFiles.filter((f) => f.size <= MAX_FILE_SIZE);
    }

    // Check duplicates against existing previews
    const existingNames = new Set(mediaPreview.map((p) => `${p.name}-${p.size}`));
    const duplicates = validFiles.filter((f) => existingNames.has(`${f.name}-${f.size}`));
    if (duplicates.length > 0) {
      toast.error(`Ignored duplicate file(s): ${duplicates.map((f) => f.name).join(', ')}`);
      validFiles = validFiles.filter((f) => !existingNames.has(`${f.name}-${f.size}`));
    }

    // Check total count
    const currentCount = mediaPreview.length;
    const remainingSlots = MAX_FILES_COUNT - currentCount;
    if (remainingSlots <= 0) {
      toast.error(`You can only upload up to ${MAX_FILES_COUNT} files.`);
      return;
    }
    if (validFiles.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more file(s) allowed. Ignored extras.`);
      validFiles = validFiles.slice(0, remainingSlots);
    }

    if (!validFiles.length) return;
    const newPreviews = validFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      const type = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : 'document';
      return { file, previewUrl, type, name: file.name, size: file.size };
    });
    setMediaPreview((prev) => [...prev, ...newPreviews]);
  }, [mediaPreview.length]);

  const removeMediaPreview = useCallback((index) => {
    setMediaPreview((prev) => {
      const item = prev[index];
      if (item?.previewUrl) {
        try { URL.revokeObjectURL(item.previewUrl); } catch (e) { /* ignore */ }
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearMediaPreview = useCallback(() => {
    setMediaPreview((prev) => {
      prev.forEach((item) => {
        if (item?.previewUrl) {
          try { URL.revokeObjectURL(item.previewUrl); } catch (e) { /* ignore */ }
        }
      });
      return [];
    });
    setSelectedPreviewIndex(0);
  }, []);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && mediaPreview.length === 0) || !selectedCustomer || !auth?.userId) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    const isReply = !!replyToMessage;

    // If media previews exist, send them with optional caption
    if (mediaPreview.length > 0) {
      setIsSendingMedia(true);
      const previewsToSend = [...mediaPreview];
      clearMediaPreview();
      if (isReply) setReplyToMessage(null);

      for (const preview of previewsToSend) {
        const tempId = `temp-media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setMessages((prev) => [
          ...prev,
          {
            id: tempId,
            content: preview.name,
            Message: text || preview.name,
            type: preview.type,
            mediaUrl: preview.previewUrl,
            direction: 1,
            sentAt: new Date().toISOString(),
            Date: new Date().toISOString().split('T')[0],
            status: 'sending',
            ...(isReply && { ContextType: 2, ReplyContext: replyToMessage }),
          },
        ]);

        try {
          // TODO: upload file to server to get permanent URL, then call sendChatMedia
          // For now, simulate a successful send
          await new Promise((resolve) => setTimeout(resolve, 800));
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId ? { ...msg, status: 'sent' } : msg
            )
          );
        } catch (err) {
          console.error('Media send error:', err);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId ? { ...msg, status: 'failed' } : msg
            )
          );
          toast.error('Failed to send media');
        }
      }

      // Also send text caption separately if present and no reply context
      if (text && !isReply) {
        try {
          const response = await sendChatText({
            phoneNo: selectedCustomer?.CustomerPhone || selectedCustomer?.Sender || '',
            message: text,
            userId: auth.userId,
            customerId: conversationId,
          });
          if (!response) toast.error('Failed to send caption');
        } catch (e) {
          toast.error('Failed to send caption');
        }
      }

      setIsSendingMedia(false);
      setSending(false);
      return;
    }

    // Text-only send
    const tempId = `temp-${Date.now()}`;

    // Optimistic UI update
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content: text,
        message: text,
        direction: 1,
        sentAt: new Date().toISOString(),
        Date: new Date().toISOString().split('T')[0],
        status: 'sending',
        ...(isReply && {
          ContextType: 2,
          ReplyContext: replyToMessage,
        }),
      },
    ]);

    try {
      let response;
      if (isReply) {
        response = await sendReplyMessage({
          phoneNo: selectedCustomer?.CustomerPhone || selectedCustomer?.Sender || '',
          message: text,
          userId: auth.userId,
          customerId: conversationId,
          contextId: replyToMessage.id || replyToMessage.MessageId || replyToMessage.autoid,
        });
      } else {
        response = await sendChatText({
          phoneNo: selectedCustomer?.CustomerPhone || selectedCustomer?.Sender || '',
          message: text,
          userId: auth.userId,
          customerId: conversationId,
        });
      }

      if (response) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: 'sent', id: response?.Data?.autoid || tempId } : msg
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: 'failed' } : msg
          )
        );
        toast.error('Failed to send message');
      }
    } catch (err) {
      console.error('Send error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      toast.error('Failed to send message');
    } finally {
      setIsSendingMedia(false);
      setSending(false);
      if (isReply) setReplyToMessage(null);
    }
  }, [input, selectedCustomer, auth?.userId, replyToMessage, mediaPreview, clearMediaPreview]);

  const handleExternalLinkClick = useCallback((url) => {
    setRedirectModal({ open: true, url });
  }, []);

  const handleReply = useCallback((message) => {
    const messageId = message?.id || message?.Id || message?.autoid || message?.MessageId;
    setReplyToMessage({
      id: messageId,
      sender: message?.direction === 1 || message?.Direction === 1 ? 'You' : getCustomerDisplayName(selectedCustomer) || 'Customer',
      text: message?.Message || message?.content || message?.text || 'Media',
      original: message,
    });
  }, [selectedCustomer]);

  const scrollToMessage = useCallback((targetId) => {
    const el = containerRef.current?.querySelector(`[data-message-id="${targetId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setBlinkMessageId(targetId);
      setTimeout(() => setBlinkMessageId(null), 2000);
    }
  }, []);

  const handleContextMenuOpen = useCallback((event, message) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      message,
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleForward = useCallback((message) => {
    setForwardMessage(message);
  }, []);

  const handleSendForward = useCallback(async (selectedContacts) => {
    if (!selectedContacts?.length || !forwardMessage || !auth?.userId) {
      toast.error('Please select at least one contact');
      return;
    }
    try {
      const response = await sendForwardMessage({
        userId: auth.userId,
        contacts: selectedContacts,
        type: 'text',
        contextType: 1,
        contextId: forwardMessage.id || forwardMessage.MessageId || forwardMessage.autoid,
        bodyText: forwardMessage.Message || forwardMessage.content || forwardMessage.text || '',
      });
      if (response) {
        toast.success('Message forwarded successfully');
      } else {
        toast.error('Failed to forward message');
      }
    } catch (error) {
      console.error('Forward error:', error);
      toast.error('Failed to forward message');
    } finally {
      setForwardMessage(null);
    }
  }, [forwardMessage, auth?.userId]);

  const handleFileUpload = useCallback(
    (e) => {
      const files = e.target.files;
      if (!files?.length || !selectedCustomer) return;
      addMediaFiles(files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [selectedCustomer, addMediaFiles]
  );

  const handleReactionSelect = useCallback((messageId, emoji) => {
    setMessageReactions((prev) => ({ ...prev, [messageId]: emoji }));
    setReactionPickerMessageId(null);
    emitReaction({
      conversationId,
      messageId,
      emoji,
      userId: auth?.userId,
    });
  }, [conversationId, auth?.userId]);

  // Listen for incoming reactions via socket
  useEffect(() => {
    const removeHandler = addMessageReactionHandler((data) => {
      if (!data) return;
      const { messageId, emoji } = data;
      if (messageId && emoji) {
        setMessageReactions((prev) => ({ ...prev, [messageId]: emoji }));
      }
    });
    return () => removeHandler();
  }, []);

  // Scroll handling for showScrollToBottom
  const handleScroll = useCallback(() => {
    const container = messagesListRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollToBottom(!isNearBottom);
    if (isNearBottom) {
      setUnreadCount(0);
      lastMessageCountRef.current = messages.length;
    }
  }, [messages.length]);

  // Load older messages on scroll-to-top
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || !conversationId || !auth?.userId) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);

    // Preserve scroll position
    const listEl = messagesListRef.current;
    const prevScrollHeight = listEl?.scrollHeight || 0;

    try {
      const response = await fetchConversationView(conversationId, nextPage, 30, auth?.userId);
      let list = response?.data?.rd || [];
      list = [...list].sort((a, b) => {
        const getTime = (m) => new Date(m?.DateTime || m?.sentAt || m?.sent_at || 0).getTime();
        return getTime(a) - getTime(b);
      });

      if (list.length > 0) {
        isPrependingRef.current = true;
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id || m.Id || m.autoid));
          const newItems = list.filter((m) => !existingIds.has(m.id || m.Id || m.autoid));
          return [...newItems, ...prev];
        });
      }

      setHasMore(response?.hasMore ?? (list.length === 30));
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoadingMore(false);
      // Restore scroll position after prepend
      requestAnimationFrame(() => {
        const el = messagesListRef.current;
        if (el) {
          const newScrollHeight = el.scrollHeight;
          el.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });
    }
  }, [isLoadingMore, hasMore, conversationId, auth?.userId, page]);

  // Drag & drop handlers (counter-based to avoid child-element flicker)
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files?.length) {
      addMediaFiles(files);
    }
  }, [addMediaFiles]);

  // Track unread messages when new messages arrive while scrolled up
  useEffect(() => {
    const container = messagesListRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    if (!isNearBottom && messages.length > lastMessageCountRef.current) {
      const newMessages = messages.length - lastMessageCountRef.current;
      setUnreadCount((prev) => prev + newMessages);
    }
    if (isNearBottom) {
      lastMessageCountRef.current = messages.length;
    }
  }, [messages.length]);

  useEffect(() => {
    const container = messagesListRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll, conversationId]);

  // Close emoji picker on click outside
  useEffect(() => {
    if (!emojiPickerOpen) return;
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [emojiPickerOpen]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (!selectedCustomer) {
    return (
      <div className="chat-conversation empty-state">
        <div className="chat-empty-center">
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  // Use the same avatar config as sidebar (processApiResponse sets it).
  // Fallback uses same seed function as sidebar for consistent color.
  const baseAvatarConfig = selectedCustomer?.avatarConfig
    || getWhatsAppAvatarConfig(getCustomerAvatarSeed(selectedCustomer), 38);

  return (
    <div className="chat-conversation">
      <ChatHeader
        selectedCustomer={selectedCustomer}
        isTabletOrMobile={isTabletOrMobile}
        isMobile={isMobile}
        onBack={onBack}
        tagsList={tagsList}
        setTagModalOpen={setTagModalOpen}
        tagsMenuAnchorEl={tagsMenuAnchorEl}
        setTagsMenuAnchorEl={setTagsMenuAnchorEl}
        canScrollLeft={canScrollLeft}
        canScrollRight={canScrollRight}
        handleScrollTags={handleScrollTags}
        tagsScrollRef={tagsScrollRef}
        assigneeList={assigneeList}
        setAssigneeList={setAssigneeList}
        escalatedList={escalatedList}
        setEscalatedList={setEscalatedList}
        auth={auth}
        setDetailsOpen={setDetailsOpen}
      />

      <ChatMessagesArea
        messages={messages}
        loading={loading}
        isDragOver={isDragOver}
        containerRef={containerRef}
        messagesListRef={messagesListRef}
        messagesEndRef={messagesEndRef}
        handleDragEnter={handleDragEnter}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        mediaPreview={mediaPreview}
        selectedPreviewIndex={selectedPreviewIndex}
        setSelectedPreviewIndex={setSelectedPreviewIndex}
        isSendingMedia={isSendingMedia}
        clearMediaPreview={clearMediaPreview}
        removeMediaPreview={removeMediaPreview}
        fileInputRef={fileInputRef}
        showScrollToBottom={showScrollToBottom}
        setShowScrollToBottom={setShowScrollToBottom}
        unreadCount={unreadCount}
        setUnreadCount={setUnreadCount}
        scrollToBottom={scrollToBottom}
        baseAvatarConfig={baseAvatarConfig}
        messageReactions={messageReactions}
        loadedMedia={loadedMedia}
        setLoadedMedia={setLoadedMedia}
        setMediaViewer={setMediaViewer}
        reactionPickerMessageId={reactionPickerMessageId}
        setReactionPickerMessageId={setReactionPickerMessageId}
        onContextMenuOpen={handleContextMenuOpen}
        onReactionSelect={handleReactionSelect}
        onExternalLinkClick={handleExternalLinkClick}
        blinkMessageId={blinkMessageId}
        scrollToMessage={scrollToMessage}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        sending={sending}
        emojiPickerOpen={emojiPickerOpen}
        setEmojiPickerOpen={setEmojiPickerOpen}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        loadMoreMessages={loadMoreMessages}
      />

      {/* Hidden file input — always rendered */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept="image/*,video/*,application/pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
        multiple
      />

      {can(6) && mediaPreview.length === 0 && (
        <ChatInputArea
          replyToMessage={replyToMessage}
          setReplyToMessage={setReplyToMessage}
          fileInputRef={fileInputRef}
          uploading={uploading}
          handleFileUpload={handleFileUpload}
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          sending={sending}
          mediaPreviewLength={mediaPreview.length}
          emojiPickerOpen={emojiPickerOpen}
          setEmojiPickerOpen={setEmojiPickerOpen}
          emojiPickerRef={emojiPickerRef}
          addMediaFiles={addMediaFiles}
        />
      )}

      <TagsModal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        selectedCustomer={selectedCustomer}
        onTagAdded={async () => {
          onConversationRead?.(true);
          // Re-fetch tags so new one reflects immediately
          if (selectedCustomer?.CustomerId && auth?.userId) {
            try {
              const tagsResponse = await fetchCustomerTags(selectedCustomer.CustomerId, auth.userId);
              if (tagsResponse?.rd) {
                setTagsList(tagsResponse.rd);
              }
            } catch (err) {
              console.error('Failed to refresh tags:', err);
            }
          }
        }}
      />

      <CustomerDetails
        customer={selectedCustomer}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />

      <MediaViewer
        open={mediaViewer.open}
        onClose={() => setMediaViewer({ open: false, src: '', filename: '', type: '' })}
        src={mediaViewer.src}
        filename={mediaViewer.filename}
        mediaItems={mediaViewer.mediaItems}
        initialIndex={mediaViewer.initialIndex ?? 0}
      />

      <MessageContextMenu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        onReply={handleReply}
        onForward={handleForward}
        message={contextMenu?.message}
        mouseX={contextMenu?.mouseX}
        mouseY={contextMenu?.mouseY}
        hideReplyForward={contextMenu?.message?.type === 'template' || contextMenu?.message?.MessageType === 'template'}
      />

      {forwardMessage && (
        <ForwardMessageModal
          message={forwardMessage}
          onSend={handleSendForward}
          onClose={() => setForwardMessage(null)}
        />
      )}

      <RedirectionModal
        isOpen={redirectModal.open}
        url={redirectModal.url}
        onClose={() => setRedirectModal({ open: false, url: '' })}
        onConfirm={() => {
          window.open(redirectModal.url, '_blank', 'noopener,noreferrer');
          setRedirectModal({ open: false, url: '' });
        }}
      />
    </div>
  );
}
