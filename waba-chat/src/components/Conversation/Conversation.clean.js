import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { Box, Typography, Avatar, Divider, Menu, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Plus } from 'lucide-react';
import './Conversation.scss';
import TagsModel from '../TagsModel/TagsModel';
import { useTagsContext } from '../../contexts/TagsContexts';
import CustomerDetails from '../CustomerDetails/CustomerDetails';
import { formatDateHeader } from '../../utils/DateFnc';
import EmojiPicker from "emoji-picker-react";
import toast from 'react-hot-toast';
import AssigneeDropdown from '../AssigneeDropdown/AssigneeDropdown';
import EscalatedDropdown from '../EscalatedDropdown/EscalatedDropdown';
import { LoginContext } from '../../context/LoginData';
import MessageContextMenu from '../MessageBubble/MessageContextMenu';
import ForwardMessage from '../ForwardMessage/ForwardMessage';
import MediaViewer from '../MediaViewer/MediaViewer';
import ChatBox from './ChatBox';
import MessageArea from './MessageArea';
import { useConversation } from './useConversation';

const Conversation = ({ selectedCustomer, onConversationRead, onViewConversationRead, onCustomerSelect }) => {
    const { tags, addTags, removeTags, triggerRefetch } = useTagsContext();
    const [openTagModal, setOpenTagModal] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [color, setColor] = useState('');
    const [contextMenu, setContextMenu] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const containerRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const lastScrollTriggerRef = useRef(0);
    const isAutoScrollingRef = useRef(false);
    const scrollListenerAttachedRef = useRef(false);
    const fileInputRef = useRef(null);
    const [showPicker, setShowPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const [forwardAnchorEl, setForwardAnchorEl] = useState(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [showMedia, setShowMedia] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { auth } = useContext(LoginContext);

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
        assigneeList,
        setAssigneeList,
        selectedAssignees,
        setSelectedAssignees,
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

        // Functions
        handleFetchtags,
        fetchAssigneeList,
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

    const handleReactionClick = (event, message) => {
        event.stopPropagation();
        setSelectedMessage(message);
        setEmojiAnchorEl(event.currentTarget);
    };

    const handleCloseEmojiPicker = () => {
        setEmojiAnchorEl(null);
        setSelectedMessage(null);
    };

    const handleMessageEmojiClick = async (emojiObject, message) => {
        try {
            if (!selectedCustomer?.CustomerId) return;

            const emoji = emojiObject.emoji || emojiObject; // Extract emoji

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
                const newReaction = { Reaction: emoji, Direction: 1 };
                updatedReactions = [...filtered, newReaction];
                reactionPayload = JSON.stringify(updatedReactions);
            }

            // 🧠 Update UI state
            // Add a flag to indicate this update is from the current user
            setMessages(prev => {
                const prevData = Array.isArray(prev) ? prev : prev?.data || [];
                const updatedData = prevData.map(msg => {
                    if (msg.MessageId === message.MessageId) {
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

            handleCloseEmojiPicker();
        } catch (error) {
            console.error("Error sending reaction:", error);
            toast.error("Failed to send reaction");
        }
    };

    const openFilePicker = (e, acceptType) => {
        e.preventDefault();
        e.stopPropagation();
        if (fileInputRef?.current) {
            fileInputRef.current.accept = acceptType;
            fileInputRef.current.value = ''; // Reset the input to allow selecting the same file again
            fileInputRef.current.oninput = (changeEvent) => {
                if (changeEvent.target.files.length > 0) {
                    // File was selected, handle it in the change handler
                    handleFileChange(changeEvent, toast);
                }
                // Close the menu after selection (or cancel)
            };
            handleCloseMessageMenu();
            fileInputRef.current.click();
        }
    };

    useEffect(() => {
        if (currentPage > 1) return;
        // Scroll to bottom for new conversations or new messages on page 1
        // Use instant scroll when loading a new conversation to avoid the scrolling animation
        scrollToBottom('instant');
    }, [messages, currentPage]);

    const scrollToBottom = useCallback((behavior = 'smooth') => {
        if (containerRef.current) {
            isAutoScrollingRef.current = true;
            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior
            });

            // Hide the scroll-to-bottom button and reset the auto-scrolling flag
            setShowScrollToBottom(false);
            setTimeout(() => {
                isAutoScrollingRef.current = false;
            }, 150);
        }
    }, []);

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
                    loadOlderMessages();
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

    const toggleEmojiPicker = () => {
        setShowPicker(!showPicker);
    };

    const onEmojiClick = (emojiObject) => {
        setInputValue(prevInput => prevInput + emojiObject.emoji);
        // Keep picker open to allow multiple emoji selections
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

    const handleCloseForward = () => {
        setForwardAnchorEl(null);
        setForwardMessage(null);
    };

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
                handleSendMessage(containerRef, setShowMedia, scrollToBottom, toast);
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
            {/* Header */}
            <div className="conversation-header">
                <div className="header-left">
                    <div style={{ width: 40, height: 40, marginRight: 10, cursor: "pointer" }}>
                        <Avatar
                            {...(selectedCustomer?.avatarConfig || {})}
                            onClick={() => setDrawerOpen(true)}
                        />
                    </div>
                    <div className="customer-info">
                        <Typography variant="subtitle1" className="customer-name">
                            {selectedCustomer.name}
                        </Typography>
                    </div>
                    {selectedCustomer?.CustomerId ? (
                        <Box
                            className="customer-tags"
                            onClick={() => setOpenTagModal(true)}
                        >
                            <Plus size={12} style={{ marginRight: 4 }} />
                            <Typography variant="caption">Add tag</Typography>
                        </Box>
                    ) : null}
                    {selectedCustomer?.CustomerId && tagsList?.length > 0 ? (
                        tagsList.map((tag, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    backgroundColor: '#e0f2f1',
                                    color: '#111',
                                    borderRadius: 10,
                                    px: 1,
                                    py: 0.3,
                                    fontSize: '12px',
                                    ml: 1,
                                    '&:hover': {
                                        backgroundColor: '#b2dfdb',
                                        cursor: 'pointer'
                                    }
                                }}
                            >
                                {tag?.TagName}
                                <CloseIcon
                                    sx={{
                                        fontSize: '14px',
                                        ml: 0.5,
                                        '&:hover': {
                                            color: 'black',
                                            transform: "scale(1.1)",
                                            transition: "all 0.2s ease-in-out"
                                        }
                                    }}
                                    onClick={(e) => {
                                        handleDeletetags(tag?.Id)
                                    }}
                                />
                            </Box>
                        ))
                    ) : null}
                </div>
                <div className="header-right">
                    {can(5) &&
                        <AssigneeDropdown
                            options={assigneeList}
                            onChange={handleAssigneeChange}
                            value={selectedAssignees}
                            selectedCustomer={selectedCustomer}
                            fetchAssigneeList={fetchAssigneeList}
                        />
                    }
                    {can(5) &&
                        <EscalatedDropdown
                            options={assigneeList}
                            onChange={handleAssigneeChange}
                            value={selectedAssignees}
                            selectedCustomer={selectedCustomer}
                            fetchAssigneeList={fetchAssigneeList}
                        />
                    }
                </div>
            </div>

            <Divider />

            {/* Messages Area - Using the MessageArea component */}
            <MessageArea
                showMedia={showMedia}
                loading={loading}
                mediaFiles={mediaFiles}
                setMediaFiles={setMediaFiles}
                handleClosePreview={handleClosePreview}
                containerRef={containerRef}
                showScrollToBottom={showScrollToBottom}
                setContextMenu={setContextMenu}
                selectedCustomer={selectedCustomer}
                scrollToBottom={scrollToBottom}
                groupMessagesByDate={groupMessagesByDate}
                formatDateHeader={formatDateHeader}
                getMessageStatusIcon={getMessageStatusIconCallback}
                parseTemplateData={parseTemplateData}
                getMediaSrcForMessage={getMediaSrcForMessage}
                handleMediaClick={handleMediaClick}
                handleReactionClick={handleReactionClick}
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
            />

            {can(6) ? (
                <ChatBox
                    replyToMessage={replyToMessage}
                    handleCancelReply={handleCancelReply}
                    handleAttachClick={handleAttachClick}
                    toggleEmojiPicker={toggleEmojiPicker}
                    showPicker={showPicker}
                    emojiPickerRef={emojiPickerRef}
                    onEmojiClick={onEmojiClick}
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
                    handleSendMessage={() => handleSendMessage(containerRef, setShowMedia, scrollToBottom, toast)}
                    mediaFiles={mediaFiles}
                />
            ) :
                <div className="message-input-area no-permission">
                    <p className="no-permission-text">🚫 You don’t have permission to send or reply to messages.</p>
                </div>
            }

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
                onSend={(selectedContacts) => handleSendForward(selectedContacts, toast)}
            />

            {
                drawerOpen === true && (
                    <CustomerDetails customer={selectedCustomer} onClose={() => setDrawerOpen(false)} open={drawerOpen} />
                )
            }
            <Menu
                anchorEl={emojiAnchorEl}
                open={Boolean(emojiAnchorEl)}
                onClose={handleCloseEmojiPicker}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                <EmojiPicker
                    onEmojiClick={(emojiObject) => handleMessageEmojiClick(emojiObject, selectedMessage)}
                    width={300}
                    height={350}
                />
            </Menu>
        </Box>
    );
};

export default Conversation;

const ViewContext = ({ contextMenu, handleCloseMenu, handleMenuAction, setContextMenu, selectedCustomer }) => {
    const handleMenuItemClick = (action) => {
        handleMenuAction(action);
        handleCloseMenu(); // Close after action
    };

    return (
        <Menu
            open={Boolean(contextMenu)}
            onClose={handleCloseMenu}
            anchorReference="anchorPosition"
            anchorPosition={
                contextMenu
                    ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                    : undefined
            }
            PaperProps={{
                style: {
                    width: "200px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    position: "fixed",
                },
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({
                    mouseX: e.clientX + 2,
                    mouseY: e.clientY + 2,
                });
            }}
        >
            <MenuItem onClick={() => handleMenuItemClick("Close")}>
                ❌ Close Chat
            </MenuItem>
        </Menu>
    );
};