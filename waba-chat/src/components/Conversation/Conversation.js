import React, { useState, useRef, useEffect, useCallback, useContext, useLayoutEffect } from 'react';
import { Box, Typography, Avatar, Divider, Menu, MenuItem, IconButton, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Plus, Tag } from 'lucide-react';
import './Conversation.scss';
import TagsModel from '../TagsModel/TagsModel';
import { useTagsContext } from '../../contexts/TagsContexts';
import CustomerDetails from '../CustomerDetails/CustomerDetails';
import { formatDateHeader } from '../../utils/DateFnc';
import toast from 'react-hot-toast';
import AssigneeDropdown from '../AssigneeDropdown/AssigneeDropdown';
import EscalatedDropdown from '../EscalatedDropdown/EscalatedDropdown';
import { LoginContext } from '../../context/LoginData';
import MessageContextMenu from '../MessageBubble/MessageContextMenu';
import ForwardMessage from '../ForwardMessage/ForwardMessage';
import MediaViewer from '../MediaViewer/MediaViewer';
import { getCustomerAvatarSeed, getCustomerDisplayName, getWhatsAppAvatarConfig, hasCustomerName } from '../../utils/globalFunc';
import ChatBox from './ChatBox';
import MessageArea from './MessageArea';
import ViewContext from './ViewContext';
import { useConversation } from './useConversation';
import { messageReaction } from '../../API/Reaction/Reaction';
import PersonIcon from '@mui/icons-material/Person';

const Conversation = ({ selectedCustomer, onConversationRead, onViewConversationRead, onCustomerSelect }) => {
    const { tags, addTags, removeTags, triggerRefetch } = useTagsContext();
    const [openTagModal, setOpenTagModal] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [color, setColor] = useState('');
    const [contextMenu, setContextMenu] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const containerRef = useRef(null);
    const mediaPreviewScrollStateRef = useRef(null);
    const prevMediaFilesLenRef = useRef(0);
    const scrollTimeoutRef = useRef(null);
    const lastScrollTriggerRef = useRef(0);
    const isAutoScrollingRef = useRef(false);
    const scrollListenerAttachedRef = useRef(false);
    const fileInputRef = useRef(null);
    const lastMessageIdRef = useRef(null);
    const lastConversationIdRef = useRef(null);
    const [showPicker, setShowPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const { auth } = useContext(LoginContext);
    const [getLength, setLength] = useState("");
    const [isSwitchingConversation, setIsSwitchingConversation] = useState(false);
    const isNarrowScreen = useMediaQuery('(max-width: 992px)');
    const isTopPanelScreen = useMediaQuery('(max-width: 1620px)');
    const isCompactDockedPanel = useMediaQuery('(max-width: 1200px)');
    const [tagsMenuAnchorEl, setTagsMenuAnchorEl] = useState(null);
    const isDetailsPanelDocked = drawerOpen === true && !isNarrowScreen;
    const dockedPanelWidth = isCompactDockedPanel ? 380 : 420;
    const scrollToBottomRightOffset = isDetailsPanelDocked ? dockedPanelWidth + 30 : 30;
    const showFullDetails = drawerOpen === true && !isNarrowScreen && isTopPanelScreen;

    // Use the conversation hook
    const {
        // State
        inputValue,
        setInputValue,
        tagsList,
        setTagsList,
        messages,
        setMessages,
        mediaFiles,
        setMediaFiles,
        showMedia,
        setShowMedia,
        assigneeList,
        setAssigneeList,
        escalatedLists,
        setEscalatedLists,
        selectedAssignees,
        setSelectedAssignees,
        selectedEscalated,
        setSelectedEscalate,
        loading,
        setLoading,
        loadingOlder,
        setLoadingOlder,
        hasMore,
        setHasMore,
        uploadProgress,
        setUploadProgress,
        loadedMedia,
        setLoadedMedia,
        replyToMessage,
        setReplyToMessage,
        forwardMessage,
        setForwardMessage,
        blinkMessageId,
        setBlinkMessageId,
        mediaViewerOpen,
        setMediaViewerOpen,
        mediaViewerItems,
        setMediaViewerItems,
        mediaViewerIndex,
        setMediaViewerIndex,
        groupMessagesByDate,
        currentPage,
        setCurrentPage,
        forwardAnchorEl,
        setForwardAnchorEl,
        messId,

        // Functions
        handleFetchtags,
        handleCloseForward,
        fetchAssigneeList,
        fetchEscalatedList,
        handleDeletetags,
        loadConversation,
        loadOlderMessages,
        parseTemplateData,
        getMediaSrcForMessage,
        getMediaKey,
        markLoaded,
        handleAttachClick,
        handleFileChange,
        handleMediaClick,
        handleClosePreview,
        handleSendMessage,
        handleReply,
        handleCancelReply,
        handleForward,
        handleSendForward,
        scrollToMessage,
        getMessageStatusIcon,
        formatDateHeader: formatDateHeaderHook,
        can
    } = useConversation(selectedCustomer, onConversationRead, onViewConversationRead);

    const hasAssigneeOptions = Array.isArray(assigneeList)
        ? assigneeList.length > 0
        : Array.isArray(assigneeList?.data)
            ? assigneeList.data.length > 0
            : false;

    const hasEscalatedOptions = Array.isArray(escalatedLists)
        ? escalatedLists.length > 0
        : Array.isArray(escalatedLists?.data)
            ? escalatedLists.data.length > 0
            : false;

    const tagsScrollRef = useRef(null);
    const [tagsOverflow, setTagsOverflow] = useState(false);
    const [canScrollTagsLeft, setCanScrollTagsLeft] = useState(false);
    const [canScrollTagsRight, setCanScrollTagsRight] = useState(false);

    const updateTagsScrollState = useCallback(() => {
        const el = tagsScrollRef.current;
        if (!el) return;

        const hasOverflow = el.scrollWidth > el.clientWidth + 1;
        setTagsOverflow(hasOverflow);
        setCanScrollTagsLeft(el.scrollLeft > 0);
        setCanScrollTagsRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    const scrollTagsBy = useCallback((delta) => {
        const el = tagsScrollRef.current;
        if (!el) return;
        el.scrollBy({ left: delta, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        updateTagsScrollState();
        const el = tagsScrollRef.current;
        if (!el) return;

        const onScroll = () => updateTagsScrollState();
        el.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', updateTagsScrollState);

        return () => {
            el.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', updateTagsScrollState);
        };
    }, [tagsList, selectedCustomer?.CustomerId, updateTagsScrollState]);


    useEffect(() => {
        setLength(messages?.data?.length)
    }, [])


    const docsParams = ".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.csv";
    const videoParams = "video/*";
    const imageParams = "image/*";

    const markLoadedCallback = useCallback((key) => {
        markLoaded(key);
    }, [markLoaded]);

    const getMediaKeyCallback = useCallback((msg, index) => {
        return getMediaKey(msg, index);
    }, [getMediaKey]);

    const open = Boolean(anchorEl);
    const tagsMenuOpen = Boolean(tagsMenuAnchorEl);

    const handleOpenTagsMenu = (event) => {
        event.stopPropagation();
        setTagsMenuAnchorEl(event.currentTarget);
    };

    const handleCloseTagsMenu = () => {
        setTagsMenuAnchorEl(null);
    };

    useEffect(() => {
        if (!isDetailsPanelDocked) {
            setTagsMenuAnchorEl(null);
        }
    }, [isDetailsPanelDocked]);

    // Close message actions menu
    const handleCloseMessageMenu = () => {
        setAnchorEl(null);
        setSelectedMessage(null);
    };

    const handleMenuClick = (event, message) => {
        event.stopPropagation();
        setSelectedMessage(message);
        setAnchorEl(event.currentTarget);
    };

    const handleMessageEmojiClick = async (emojiObject, message) => {
        try {
            if (!selectedCustomer?.CustomerId && selectedCustomer?.CustomerId !== 0) return;

            const emoji = emojiObject?.emoji || emojiObject; // Extract emoji character
            const unified = emojiObject?.unified;

            // Determine current reaction state (toggle logic)
            let isSameReaction = false;
            let currentReactions = [];

            if (message.ReactionEmojis) {
                if (typeof message.ReactionEmojis === "string") {
                    try {
                        currentReactions = JSON.parse(message.ReactionEmojis);
                    } catch (e) {
                        // Handle legacy comma-separated format
                        currentReactions = message.ReactionEmojis.split(",").map(r => ({
                            Reaction: r,
                            Direction: 1
                        }));
                    }
                } else if (Array.isArray(message.ReactionEmojis)) {
                    currentReactions = message.ReactionEmojis;
                }
            }

            // Check if the same emoji already exists for the agent (Direction: 1)
            const existingIndex = currentReactions.findIndex(
                r => r.Direction === 1 && r.Reaction === emoji
            );

            let updatedReactions;
            let reactionPayload; // Value to send to API

            if (existingIndex >= 0) {
                // 🧩 Toggle off — remove the same emoji
                currentReactions.splice(existingIndex, 1);
                updatedReactions = currentReactions;
                reactionPayload = ""; // send empty string to API
            } else {
                // ✅ Add new agent reaction
                // Remove any previous agent reaction
                const filtered = currentReactions.filter(r => r.Direction !== 1);
                const newReaction = { Reaction: emoji, Unified: unified, Direction: 1 };
                updatedReactions = [...filtered, newReaction];
                reactionPayload = JSON.stringify(updatedReactions);
            }

            // Use Id if messageId is not available (for optimistic updates)
            const messageIdToUse = message.MessageId || messId;

            if (!messageIdToUse) {
                console.error("No valid message ID found for reaction");
                toast.error("Failed to send reaction: Message ID missing");
                return;
            }

            // 🔥 Send updated reaction to API
            await messageReaction(
                auth?.userId,
                selectedCustomer.CustomerId,
                selectedCustomer.CustomerPhone,
                messageIdToUse,
                JSON.parse(reactionPayload || "[]")?.find(r => r.Direction === 1)?.Reaction || ""
            );

            // 🧠 Update UI state
            // Add a flag to indicate this update is from the current user
            setMessages(prev => {
                const prevData = Array.isArray(prev) ? prev : prev?.data || [];
                const updatedData = prevData.map(msg => {
                    if ((msg.MessageId && msg.MessageId === message.MessageId) ||
                        (msg.Id && msg.Id === message.Id)) {
                        return {
                            ...msg,
                            ReactionEmojis: reactionPayload,
                            _isFromCurrentUser: true // Flag to identify current user's update
                        };
                    }
                    return msg;
                });

                return Array.isArray(prev)
                    ? updatedData
                    : { ...prev, data: updatedData };
            });

            // Show correct feedback
            if (reactionPayload === "") {
                toast("Reaction removed!");
            } else {
                toast.success("Reaction sent!");
            }
        } catch (error) {
            console.error("Error sending reaction:", error);
            toast.error("Failed to send reaction");
        }
    };

    const captureMessageScrollState = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        mediaPreviewScrollStateRef.current = {
            scrollTop: el.scrollTop,
            bottomGap: el.scrollHeight - el.clientHeight - el.scrollTop,
        };
    }, []);

    const mediaFilesLength = mediaFiles?.length || 0;
    useEffect(() => {
        const prevLen = prevMediaFilesLenRef.current;

        if (prevLen === 0 && mediaFilesLength > 0) {
            const el = containerRef.current;
            if (el && !mediaPreviewScrollStateRef.current) {
                mediaPreviewScrollStateRef.current = {
                    scrollTop: el.scrollTop,
                    bottomGap: el.scrollHeight - el.clientHeight - el.scrollTop,
                };
            }
        }

        if (prevLen > 0 && mediaFilesLength === 0) {
            const state = mediaPreviewScrollStateRef.current;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const el = containerRef.current;
                    if (!el || !state) return;
                    const nextTop = typeof state.bottomGap === 'number'
                        ? Math.max(0, el.scrollHeight - el.clientHeight - state.bottomGap)
                        : Math.max(0, Math.min(el.scrollHeight - el.clientHeight, state.scrollTop ?? 0));
                    el.scrollTop = nextTop;
                });
            });
        }

        prevMediaFilesLenRef.current = mediaFilesLength;
    }, [mediaFilesLength]);

    const openFilePicker = (e, acceptType) => {
        e.preventDefault();
        e.stopPropagation();
        if (fileInputRef?.current) {
            fileInputRef.current.accept = acceptType;
            fileInputRef.current.value = ''; // Reset the input to allow selecting the same file again
            fileInputRef.current.oninput = (changeEvent) => {
                if (changeEvent.target.files.length > 0) {
                    captureMessageScrollState();
                    // File was selected, handle it in the change handler
                    handleFileChange(changeEvent, toast);
                }
                // Close the menu after selection (or cancel)
            };
            handleCloseMessageMenu();
            fileInputRef.current.click();
        }
    };

    const scrollToBottom = useCallback((behavior = 'smooth') => {
        if (containerRef.current) {
            isAutoScrollingRef.current = true;

            const normalizedBehavior =
                behavior === 'instant'
                    ? 'auto'
                    : (behavior === 'smooth' || behavior === 'auto')
                        ? behavior
                        : 'smooth';

            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: normalizedBehavior
            });

            // Hide the scroll-to-bottom button and reset the auto-scrolling flag
            setShowScrollToBottom(false);
            setTimeout(() => {
                isAutoScrollingRef.current = false;
            }, 150);
        }
    }, []);

    // 🚀 Handle initial scroll on conversation switch
    useLayoutEffect(() => {
        const currentConvId = selectedCustomer?.ConversationId;
        if (!currentConvId) return;

        // 1. Detect conversation switch - immediately fade out
        if (currentConvId !== lastConversationIdRef.current) {
            setIsSwitchingConversation(true);
            lastConversationIdRef.current = currentConvId;
        }
    }, [selectedCustomer?.ConversationId]);

    // 2. Separate effect for scrolling after data loads
    useLayoutEffect(() => {
        if (!isSwitchingConversation || loading || !containerRef.current) return;

        const messageList = Array.isArray(messages?.data) ? messages.data : [];
        if (messageList.length === 0) return;

        // Wait for fade-out animation to complete (200ms for safety)
        const fadeOutTimer = setTimeout(() => {
            if (containerRef.current) {
                // Instant scroll to bottom while invisible
                containerRef.current.scrollTop = containerRef.current.scrollHeight;

                // Update last message ID
                const lastMessage = messageList[messageList.length - 1];
                lastMessageIdRef.current = lastMessage?.Id || lastMessage?.MessageId || lastMessage?.id;

                // Wait a moment then fade back in
                const fadeInTimer = setTimeout(() => {
                    setIsSwitchingConversation(false);
                }, 100);

                return () => clearTimeout(fadeInTimer);
            }
        }, 200);

        return () => clearTimeout(fadeOutTimer);
    }, [isSwitchingConversation, loading, messages]);

    // Handle auto-scrolling for NEW messages in the same conversation
    useEffect(() => {
        if (currentPage > 1) return;

        const messageList = Array.isArray(messages?.data) ? messages.data : [];
        const currentConvId = selectedCustomer?.ConversationId;

        if (messageList.length === 0) return;

        const lastMessage = messageList[messageList.length - 1];
        const lastId = lastMessage?.Id || lastMessage?.MessageId || lastMessage?.id;

        // If it's the same conversation but a NEW message was added
        if (currentConvId === lastConversationIdRef.current && lastId !== lastMessageIdRef.current) {
            scrollToBottom('smooth');
            lastMessageIdRef.current = lastId;
        }
    }, [messages, currentPage, scrollToBottom, selectedCustomer?.ConversationId]);

    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const { scrollTop, scrollHeight, clientHeight } = container;

        // Show scroll-to-bottom button when scrolled up more than 300px from bottom
        const scrollBottom = scrollHeight - clientHeight - scrollTop;
        if (!isAutoScrollingRef.current) {
            setShowScrollToBottom(scrollBottom > 300);
        }

        // Load older messages when scrolled to top
        if (hasMore && !isAutoScrollingRef.current) {
            const dynamicThreshold = Math.max(50, Math.floor(clientHeight * 0.2));

            if (scrollTop <= dynamicThreshold) {
                const now = Date.now();
                if (now - lastScrollTriggerRef.current < 1000) return;
                if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

                scrollTimeoutRef.current = setTimeout(() => {
                    lastScrollTriggerRef.current = now;
                    // Pass containerRef to maintain scroll position
                    loadOlderMessages(containerRef);
                }, 150);
            }
        }
    }, [hasMore, loadOlderMessages]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !selectedCustomer?.ConversationId) {
            scrollListenerAttachedRef.current = false;
            return;
        }

        // Reset flag when conversation changes
        scrollListenerAttachedRef.current = false;

        // Wait for messages to load and scroll to bottom to complete
        // before attaching scroll listener
        const timeoutId = setTimeout(() => {
            const checkContainer = containerRef.current;
            if (checkContainer &&
                checkContainer.scrollHeight > checkContainer.clientHeight &&
                !scrollListenerAttachedRef.current) {
                // Only attach if there's scrollable content and not already attached
                checkContainer.addEventListener('scroll', handleScroll, { passive: true });
                scrollListenerAttachedRef.current = true;
            }
        }, 1200); // Wait for scrollToBottom animation (1000ms) + buffer

        return () => {
            clearTimeout(timeoutId);
            const checkContainer = containerRef.current;
            if (checkContainer && scrollListenerAttachedRef.current) {
                checkContainer.removeEventListener('scroll', handleScroll);
                scrollListenerAttachedRef.current = false;
            }
            // Cleanup scroll timeout on unmount
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [handleScroll, selectedCustomer?.ConversationId]);

    // Track day change for date headers without refetch loop
    useEffect(() => {
        const updateCurrentDate = () => {
            const today = new Date().toISOString().split('T')[0];
            if (today !== currentDate) {
                setCurrentDate(today);
            }
        };

        const interval = setInterval(updateCurrentDate, 60000);
        updateCurrentDate();

        return () => clearInterval(interval);
    }, [currentDate]);

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleMenuAction = (action) => {
        if (action === "Close") {
            onCustomerSelect(null);
        }
        handleCloseMessageMenu();
    };

    const handleAssigneeChange = (selectedValues) => {
        setSelectedAssignees(selectedValues)
    };

    const handleEscalateChange = (selectedValues) => {
        setSelectedEscalate(selectedValues)
    };

    const toggleEmojiPicker = () => {
        setShowPicker(!showPicker);
    };

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) &&
                !event.target.closest('.attach-button')) {
                setShowPicker(false);
            }
        };

        if (showPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPicker]);

    // Message context menu handlers
    const [messageContextMenu, setMessageContextMenu] = useState(null);

    const handleContextMenu = (event, message) => {
        event.preventDefault();
        setMessageContextMenu(
            messageContextMenu === null
                ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4, message }
                : null
        );
    };

    const getMessageStatusIconCallback = useCallback((msg) => {
        return getMessageStatusIcon(msg);
    }, [getMessageStatusIcon]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputValue.trim() || (mediaFiles && mediaFiles.length > 0)) {
                handleSendMessage(containerRef, scrollToBottom, toast);
                setInputValue("");
            }
        }
    };

    if (!selectedCustomer) {
        return (
            <div className="conversation-container empty-state">
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#6b7280'
                }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Select a conversation
                    </Typography>
                    <Typography variant="body2">
                        Choose a customer from the list to start chatting
                    </Typography>
                </Box>
            </div>
        );
    }

    return (
        <Box className="conversation-container">
            {/* Media Viewer */}
            {mediaViewerOpen && (
                <MediaViewer
                    mediaItems={mediaViewerItems}
                    initialIndex={mediaViewerIndex}
                    onClose={() => setMediaViewerOpen(false)}
                />
            )}
            <div className="conversation-layout">
                <div className="conversation-main">
                    {/* Header */}
                    {!showFullDetails && (
                        <div className="conversation-header">
                            <div className="header-left">
                                <div style={{ width: 40, height: 40, marginRight: 10, cursor: "pointer" }}>
                                    {!hasCustomerName(selectedCustomer) ? (
                                        <Avatar
                                            {...getWhatsAppAvatarConfig(getCustomerAvatarSeed(selectedCustomer), 40)}
                                            onClick={() => setDrawerOpen(true)}
                                        >
                                            <PersonIcon fontSize="small" />
                                        </Avatar>
                                    ) : (
                                        <Avatar
                                            {...(selectedCustomer?.avatarConfig || getWhatsAppAvatarConfig(getCustomerAvatarSeed(selectedCustomer), 40))}
                                            onClick={() => setDrawerOpen(true)}
                                        />
                                    )}
                                </div>
                                <div className="customer-info">
                                    <Typography variant="subtitle1" className="customer-name">
                                        {getCustomerDisplayName(selectedCustomer)}
                                    </Typography>
                                </div>
                                {selectedCustomer?.CustomerId ? (
                                    isDetailsPanelDocked ? (
                                        <IconButton
                                            size="small"
                                            onClick={handleOpenTagsMenu}
                                            sx={{
                                                ml: 1,
                                                width: 34,
                                                height: 34,
                                                borderRadius: '10px',
                                                border: '1px solid rgba(0,0,0,0.08)',
                                                background: 'rgba(255,255,255,0.9)',
                                            }}
                                        >
                                            <Tag size={16} />
                                        </IconButton>
                                    ) : (
                                        <Box
                                            className="customer-tags"
                                            onClick={() => setOpenTagModal(true)}
                                        >
                                            <Plus size={12} style={{ marginRight: 4 }} />
                                            <Typography variant="caption">Add tag</Typography>
                                        </Box>
                                    )
                                ) : null}
                                {selectedCustomer?.CustomerId && !isDetailsPanelDocked && tagsList?.length > 0 ? (
                                    <div className="customer-tags-wrapper">
                                        {tagsOverflow && canScrollTagsLeft ? (
                                            <button
                                                type="button"
                                                className="tag-scroll-btn left"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    scrollTagsBy(-300);
                                                }}
                                            >
                                                <ChevronLeftIcon fontSize="small" />
                                            </button>
                                        ) : null}

                                        <div className="customer-tags-scroll" ref={tagsScrollRef}>
                                            {tagsList.map((tag, index) => (
                                                <Box
                                                    className="customer-tags-chip"
                                                    key={index}
                                                >
                                                    {tag?.TagName}
                                                    <CloseIcon
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeletetags(tag?.Id)
                                                        }}
                                                    />
                                                </Box>
                                            ))}
                                        </div>

                                        {tagsOverflow && canScrollTagsRight ? (
                                            <button
                                                type="button"
                                                className="tag-scroll-btn right"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    scrollTagsBy(300);
                                                }}
                                            >
                                                <ChevronRightIcon fontSize="small" />
                                            </button>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                            <div className="header-right">
                                {can(5) && hasAssigneeOptions &&
                                    <AssigneeDropdown
                                        options={assigneeList}
                                        onChange={handleAssigneeChange}
                                        value={selectedAssignees}
                                        selectedCustomer={selectedCustomer}
                                        fetchAssigneeList={fetchAssigneeList}
                                    />
                                }
                                {can(5) && hasEscalatedOptions &&
                                    <EscalatedDropdown
                                        options={escalatedLists}
                                        onChange={handleEscalateChange}
                                        value={selectedEscalated}
                                        selectedCustomer={selectedCustomer}
                                        fetchEscalatedList={fetchEscalatedList}
                                    />
                                }
                            </div>
                        </div>
                    )}

                    {showFullDetails ? (
                        <div className="conversation-details-full">
                            <CustomerDetails
                                customer={selectedCustomer}
                                onClose={() => setDrawerOpen(false)}
                                open={drawerOpen}
                                variant="panel"
                            />
                        </div>
                    ) : (
                        <>
                            <Menu
                                anchorEl={tagsMenuAnchorEl}
                                open={tagsMenuOpen}
                                onClose={handleCloseTagsMenu}
                                PaperProps={{
                                    sx: {
                                        borderRadius: 2,
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        minWidth: 220,
                                    }
                                }}
                            >
                                <MenuItem
                                    onClick={() => {
                                        handleCloseTagsMenu();
                                        setOpenTagModal(true);
                                    }}
                                    dense
                                >
                                    <Plus size={14} style={{ marginRight: 8 }} />
                                    Add tag
                                </MenuItem>
                                <Divider />
                                {(tagsList || []).length > 0 ? (
                                    tagsList.map((tag) => (
                                        <MenuItem
                                            key={tag?.Id ?? tag?.TagName}
                                            dense
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 1,
                                            }}
                                        >
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {tag?.TagName}
                                            </span>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeletetags(tag?.Id);
                                                }}
                                                sx={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                <CloseIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem dense disabled>
                                        No tags
                                    </MenuItem>
                                )}
                            </Menu>

                            {/* Messages Area - Using the MessageArea component */}
                            <MessageArea
                                showMedia={showMedia}
                                setShowMedia={setShowMedia}
                                loading={loading}
                                mediaFiles={mediaFiles}
                                setMediaFiles={setMediaFiles}
                                handleClosePreview={handleClosePreview}
                                containerRef={containerRef}
                                showScrollToBottom={showScrollToBottom}
                                scrollToBottomRightOffset={scrollToBottomRightOffset}
                                setContextMenu={setContextMenu}
                                selectedCustomer={selectedCustomer}
                                scrollToBottom={scrollToBottom}
                                groupMessagesByDate={groupMessagesByDate}
                                formatDateHeader={formatDateHeader}
                                getMessageStatusIcon={getMessageStatusIconCallback}
                                parseTemplateData={parseTemplateData}
                                getMediaSrcForMessage={getMediaSrcForMessage}
                                handleMediaClick={handleMediaClick}
                                handleMessageEmojiClick={handleMessageEmojiClick}
                                handleMenuClick={handleMenuClick}
                                handleContextMenu={handleContextMenu}
                                scrollToMessage={scrollToMessage}
                                handleReply={handleReply}
                                handleForward={handleForward}
                                blinkMessageId={blinkMessageId}
                                setBlinkMessageId={setBlinkMessageId}
                                loadedMedia={loadedMedia}
                                setLoadedMedia={setLoadedMedia}
                                getMediaKey={getMediaKeyCallback}
                                markLoaded={markLoadedCallback}
                                uploadProgress={uploadProgress}
                                replyToMessage={replyToMessage}
                                isSwitchingConversation={isSwitchingConversation}
                            />

                            {can(6) ? (
                                <ChatBox
                                    replyToMessage={replyToMessage}
                                    handleCancelReply={handleCancelReply}
                                    handleAttachClick={handleAttachClick}
                                    toggleEmojiPicker={toggleEmojiPicker}
                                    showPicker={showPicker}
                                    emojiPickerRef={emojiPickerRef}
                                    showMedia={showMedia}
                                    fileInputRef={fileInputRef}
                                    openFilePicker={openFilePicker}
                                    imageParams={imageParams}
                                    videoParams={videoParams}
                                    docsParams={docsParams}
                                    handleFileChange={(e) => handleFileChange(e, toast)}
                                    inputValue={inputValue}
                                    setInputValue={setInputValue}
                                    handleKeyPress={handleKeyPress}
                                    handleSendMessage={() => handleSendMessage(containerRef, scrollToBottom, toast)}
                                    mediaFiles={mediaFiles}
                                />
                            ) :
                                <div className="message-input-area no-permission">
                                    <p className="no-permission-text">🚫 You don’t have permission to send or reply to messages.</p>
                                </div>
                            }
                        </>
                    )}
                </div>

                {drawerOpen === true && (
                    isNarrowScreen ? (
                        <CustomerDetails
                            customer={selectedCustomer}
                            onClose={() => setDrawerOpen(false)}
                            open={drawerOpen}
                            variant="drawer"
                        />
                    ) : (
                        !isTopPanelScreen ? (
                            <div className="conversation-right-panel">
                                <CustomerDetails
                                    customer={selectedCustomer}
                                    onClose={() => setDrawerOpen(false)}
                                    open={drawerOpen}
                                    variant="panel"
                                />
                            </div>
                        ) : null
                    )
                )}
            </div>

            <TagsModel openTagModal={openTagModal} setOpenTagModal={setOpenTagModal} tags={tags} addTags={addTags} removeTags={removeTags} tagInput={tagInput} setTagInput={setTagInput} color={color} setColor={setColor} selectedCustomer={selectedCustomer} handleFetchtags={handleFetchtags} />

            <ViewContext
                contextMenu={contextMenu}
                handleCloseMenu={handleCloseContextMenu}
                handleMenuAction={handleMenuAction}
                setContextMenu={setContextMenu}
                selectedCustomer={selectedCustomer}
            />

            {/* Message Context Menu */}
            <MessageContextMenu
                anchorEl={messageContextMenu?.anchorEl}
                open={!!messageContextMenu}
                onClose={() => setMessageContextMenu(null)}
                onReply={handleReply}
                onForward={handleForward}
                message={messageContextMenu?.message}
                mouseX={messageContextMenu?.mouseX}
                mouseY={messageContextMenu?.mouseY}
            />

            <ForwardMessage
                message={forwardMessage}
                open={!!forwardAnchorEl && !!forwardMessage}
                anchorEl={forwardAnchorEl}
                onClose={handleCloseForward}
                onSend={handleSendForward}
            />

        </Box>
    );
};

export default Conversation;