import React, { useState, useRef, useEffect, useCallback, useMemo, useContext } from 'react';
import { Box, Typography, TextField, IconButton, Avatar, Divider, CircularProgress, Skeleton, Menu, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AttachFile } from '@mui/icons-material';
import { SendHorizontal, Plus, Clock3, Image, Video, FileText, Download, AlertCircle, CheckCheck, Check, Smile, ChevronDown, SmilePlus, ChevronDownCircle } from 'lucide-react';
import './Conversation.scss';
import TagsModel from '../TagsModel/TagsModel';
import { useTagsContext } from '../../contexts/TagsContexts';
import CustomerDetails from '../CustomerDetails/CustomerDetails';
import { conversationView } from '../../API/ConversationView/ConversationView';
import { formatDateHeader, FormatDateIST } from '../../utils/DateFnc';
import { sendText } from '../../API/SendText/SendText';
import EmojiPicker from "emoji-picker-react";
import { addMessageHandler, addMessageHandlerFromAssigningUser, addMessageReactionHandler, addStatusHandler, getSocket, isSocketConnected } from '../../socket';
import { readMessage } from '../../API/ReadMessage/ReadMessage';
import toast from 'react-hot-toast';
import { UploadMedia } from '../../API/InitialApi/UploadMedia';
import MediaPreview from '../MediaPreview/MediaPreview';
import { sendMedia } from '../../API/SendMedia/SendMedia';
import { MediaApi } from '../../API/InitialApi/MediaApi';
import { fetchTagsApi } from '../../API/FetchTags/FetchTagsApi';
import { deleteAssignedTags } from '../../API/DeleteAssignedTags/DeleteAssignedTags';
import AssigneeDropdown from '../AssigneeDropdown/AssigneeDropdown';
import { fetchAssignLists } from '../../API/AssignList/AssignListApi';
import { handleArchieveChat } from '../CustomerLists/CustomerLists';
import { archieveApi } from '../../API/ArchieveAPi/ArchieveApi';
import { unArchieveApi } from '../../API/UnArchieveApi/UnArchieveApi';
import EscalatedDropdown from '../EscalatedDropdown/EscalatedDropdown';
import { LoginContext } from '../../context/LoginData';
import { DoubleTick } from '../../utils/Svg';
import DynamicTemplate from '../DynamicTemplate/DynamicTemplate';
import ReplyPreview from '../ReplyToComponents/ReplyPreview';
import MessageBubble from '../MessageBubble/MessageBubble';
import MessageContextMenu from '../MessageBubble/MessageContextMenu';
import ForwardMessage from '../ForwardMessage/ForwardMessage';
import { replyTo } from '../../API/ReplyTo/ReplyTo';
import { forwardTo } from '../../API/ForwardTo/ForwardTo';
import { messageReaction } from '../../API/Reaction/Reaction';
import MediaViewer from '../MediaViewer/MediaViewer';
import ChatBox from './ChatBox';
import MessageArea from './MessageArea';

const Conversation = ({ selectedCustomer, onConversationRead, onViewConversationRead, onCustomerSelect }) => {
    const { tags, addTags, removeTags, triggerRefetch } = useTagsContext();
    const [inputValue, setInputValue] = useState("");
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
    const [debouncedInputValue, setDebouncedInputValue] = useState("");
    const [tagsList, setTagsList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [tempConversationId, setTempConversationId] = useState(null);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [openTagModal, setOpenTagModal] = useState(false);
    const [assigneeList, setAssigneeList] = useState([]);
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [color, setColor] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;
    const [loading, setLoading] = useState(false);        // Initial load
    const [loadingOlder, setLoadingOlder] = useState(false); // Older messages
    const [hasMore, setHasMore] = useState(true);
    const [contextMenu, setContextMenu] = useState(null);
    const [showMedia, setShowMedia] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const containerRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const lastScrollTriggerRef = useRef(0);
    const isAutoScrollingRef = useRef(false);
    const scrollListenerAttachedRef = useRef(false);
    const debounceTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const [mediaCache, setMediaCache] = useState({}); // MediaId -> resolved URL
    const [loadedMedia, setLoadedMedia] = useState({}); // { [mediaKey]: true/false }
    const [replyToMessage, setReplyToMessage] = useState(null); // Track message being replied to
    const [messageContextMenu, setMessageContextMenu] = useState(null); // { mouseX, mouseY, message }
    const selectedCustomerRef = useRef(selectedCustomer);
    const { auth } = useContext(LoginContext);
    const [showPicker, setShowPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const [storeMessData, setStoreMessData] = useState({
        messageId: "",
    });
    const [forwardAnchorEl, setForwardAnchorEl] = useState(null);
    const [forwardMessage, setForwardMessage] = useState(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [blinkMessageId, setBlinkMessageId] = useState(null);
    const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
    const [mediaViewerItems, setMediaViewerItems] = useState([]);
    const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
    const { permissions, PERMISSION_SET } = useContext(LoginContext);

    const can = (perm) => PERMISSION_SET.has(perm);

    console.log("data rendered")

    const docsParams = ".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.csv";

    const videoParams = "video/*";

    const imageParams = "image/*"

    // // Debounce input value
    // useEffect(() => {
    //     // Clear the previous timeout
    //     if (debounceTimeoutRef.current) {
    //         clearTimeout(debounceTimeoutRef.current);
    //     }

    //     // Set a new timeout
    //     debounceTimeoutRef.current = setTimeout(() => {
    //         setDebouncedInputValue(inputValue);
    //     }, 150); // 150ms delay

    //     // Cleanup function to clear timeout on unmount or when inputValue changes
    //     return () => {
    //         if (debounceTimeoutRef.current) {
    //             clearTimeout(debounceTimeoutRef.current);
    //         }
    //     };
    // }, [inputValue]);

    const markLoaded = useCallback((key) => {
        setLoadedMedia(prev => ({ ...prev, [key]: true }));
    }, []);

    // Update the ref when selectedCustomer changes
    useEffect(() => {
        selectedCustomerRef.current = selectedCustomer;
    }, [selectedCustomer]);

    const getMediaKey = (msg, index) =>
        msg?.Id ?? msg?.id ?? msg?.mediaId ?? msg?.MediaUrl ?? msg?.fileName ?? `m-${index}`;

    const messagesEndRef = useRef(null);

    const open = Boolean(anchorEl);

    // Open menu when attach icon clicked
    const handleAttachClick = (event) => {
        setAnchorEl(event.currentTarget);
        setShowMedia(!showMedia)
    };

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

            // 🔥 Send updated reaction to API
            await messageReaction(
                auth?.userId,
                selectedCustomer.CustomerId,
                selectedCustomer.CustomerPhone,
                message.MessageId,
                JSON.parse(reactionPayload)?.[0]?.Reaction // ✅ "" for removal, JSON string for add
            );

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

    const handleClosePreview = () => {
        setMediaFiles([]);
    }

    // Actions

    const openFilePicker = (e, acceptType) => {
        e.preventDefault();
        e.stopPropagation();
        if (fileInputRef?.current) {
            fileInputRef.current.accept = acceptType;
            fileInputRef.current.value = ''; // Reset the input to allow selecting the same file again
            fileInputRef.current.oninput = (changeEvent) => {
                if (changeEvent.target.files.length > 0) {
                    // File was selected, handle it in the change handler
                    handleFileChange(changeEvent);
                }
                // Close the menu after selection (or cancel)
            };
            handleCloseMessageMenu();
            fileInputRef.current.click();
        }
    }

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // Allowed MIME types and extensions
        const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif", "image/gif"];
        const videoTypes = ["video/mp4", "video/mov", "video/mkv", "video/3gpp", "video/webm"];
        const docExts = [".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx", ".ppt", ".pptx", ".csv", ".zip"];

        const validFiles = [];
        const errors = {
            images: [],
            videos: [],
            docs: [],
            others: []
        };

        files.forEach((file) => {
            const fileType = file.type;
            const fileName = file.name.toLowerCase();
            const fileSizeMB = file.size / (1024 * 1024);

            let isValid = false;

            // ✅ Image validation
            if (imageTypes.includes(fileType)) {
                if (fileSizeMB <= 16) {
                    isValid = true;
                } else {
                    errors.images.push(`${file.name} (>${fileSizeMB.toFixed(1)}MB)`);
                }
            }
            // ✅ Video validation
            else if (videoTypes.includes(fileType)) {
                if (fileSizeMB <= 64) {
                    isValid = true;
                } else {
                    errors.videos.push(`${file.name} (>${fileSizeMB.toFixed(1)}MB)`);
                }
            }
            // ✅ Document validation
            else if (docExts.some(ext => fileName.endsWith(ext))) {
                if (fileSizeMB <= 100) {
                    isValid = true;
                } else {
                    errors.docs.push(`${file.name} (>${fileSizeMB.toFixed(1)}MB)`);
                }
            }
            // ❌ Unsupported file
            else {
                errors.others.push(file.name);
            }

            if (isValid) validFiles.push(file);
        });

        if (validFiles.length) {
            setMediaFiles((prev) => [...prev, ...validFiles]);
        }

        // 🔔 Show grouped errors by category
        if (errors.images.length) {
            toast.error(`❌ Images must be <16MB:\n${errors.images.join(", ")}`);
        }
        if (errors.videos.length) {
            toast.error(`❌ Videos must be <64MB:\n${errors.videos.join(", ")}`);
        }
        if (errors.docs.length) {
            toast.error(`❌ Documents must be <100MB:\n${errors.docs.join(", ")}`);
        }
        if (errors.others.length) {
            toast.error(`❌ Unsupported files:\n${errors.others.join(", ")}`);
        }

        // Reset input so same file can be re-selected
        e.target.value = "";
    };

    // Resolve media src for a message (preview > Message > fetched via API cache)
    // Parse template message data from message body
    const parseTemplateData = useCallback((message) => {
        if (!message || message.MessageType !== 'template' || !message.MessageBody) {
            return { isTemplate: false };
        }

        try {
            const body = typeof message.MessageBody === 'string'
                ? JSON.parse(message.MessageBody)
                : message.MessageBody;

            const template = body?.payload?.template;
            if (!template) return { isTemplate: false };

            // Extract template parameters
            const params = {};
            const bodyComponent = template.components?.find(c => c.type === 'body');
            if (bodyComponent?.parameters) {
                bodyComponent.parameters.forEach((param, index) => {
                    if (param.type === 'text') {
                        params[`param${index + 1}`] = param.text;
                    }
                });
            }

            return {
                isTemplate: true,
                templateName: template.name,
                params,
                language: template.language?.code || 'en',
                components: template.components || []
            };
        } catch (error) {
            console.error('Error parsing template message:', error);
            return { isTemplate: false };
        }
    }, []);

    const getMediaSrcForMessage = useCallback((msg) => {
        if (!msg) return '';
        if (msg?.previewUrl) return msg?.previewUrl;
        const id = msg?.MediaUrl || msg?.mediaId || msg?.mediaURL || null;
        if (!id) return '';
        return mediaCache[id] || '';
    }, [mediaCache]);

    // Prefetch media Blobs for messages that have MediaUrl and are not yet cached
    useEffect(() => {
        const list = Array.isArray(messages?.data) ? messages.data : (Array.isArray(messages) ? messages : []);
        const idsToFetch = Array.from(new Set(
            list
                .filter(m => m && m.MessageType && m.MessageType !== 'text' && (m.MediaUrl))
                .map(m => m.MediaUrl)
        )).filter(id => id && !mediaCache[id]);

        if (idsToFetch.length === 0) return;

        idsToFetch.forEach(async (id) => {
            try {
                const blob = await MediaApi(auth?.whatsappKey, auth?.whatsappNumber, id);
                if (blob) {
                    const objectUrl = URL.createObjectURL(blob);
                    setMediaCache(prev => ({ ...prev, [id]: objectUrl }));
                }
            } catch (err) {
                console.error('Media fetch failed for', id, err);
            }
        });
    }, [messages, selectedCustomer?.ConversationId]);

    useEffect(() => {
        if (selectedCustomer && onConversationRead) {
            onConversationRead(true);
        }

        if (selectedCustomer && onViewConversationRead) {
            onViewConversationRead(true);
        }

        return () => {
            if (onConversationRead) {
                onConversationRead(false);
            }
            if (onViewConversationRead) {
                onViewConversationRead(false);
            }
        };
    }, [selectedCustomer, onConversationRead, onViewConversationRead]);

    const processedMessageIds = useRef(new Set());

    const addUniqueMessage = (data) => {
        const incomingId = data?.Id || data?.id || data?.messageId;
        if (!incomingId) return;

        // Prevent duplicate processing
        if (processedMessageIds.current.has(incomingId)) {
            return;
        }
        processedMessageIds.current.add(incomingId);

        setMessages((prevMessages) => {
            const prevData = Array.isArray(prevMessages)
                ? prevMessages
                : prevMessages?.data || [];

            const updatedData = [...prevData];
            const existingMsgIndex = updatedData.findIndex(msg =>
                msg?.Id === incomingId || msg?.id === incomingId || msg?.messageId === incomingId
            );

            if (existingMsgIndex >= 0) {
                // Existing message found
                const existingMsg = updatedData[existingMsgIndex];

                // 🧩 Handle reactions update
                let updatedReactions = existingMsg.ReactionEmojis || [];

                // Parse existing reactions if they exist
                if (existingMsg.ReactionEmojis) {
                    if (typeof existingMsg.ReactionEmojis === 'string') {
                        try {
                            updatedReactions = JSON.parse(existingMsg.ReactionEmojis);
                        } catch (e) {
                            // If parsing fails, treat as comma-separated string
                            updatedReactions = existingMsg.ReactionEmojis.split(',').map(reaction => ({
                                Reaction: reaction,
                                Direction: 0 // Default to client direction for backward compatibility
                            }));
                        }
                    } else if (Array.isArray(existingMsg.ReactionEmojis)) {
                        updatedReactions = existingMsg.ReactionEmojis;
                    }
                }

                // Parse incoming reactions
                let incomingReactions = [];
                if (data.ReactionEmojis) {
                    if (typeof data.ReactionEmojis === 'string') {
                        try {
                            incomingReactions = JSON.parse(data.ReactionEmojis);
                        } catch (e) {
                            // If parsing fails, treat as comma-separated string
                            incomingReactions = data.ReactionEmojis.split(',').map(reaction => ({
                                Reaction: reaction,
                                Direction: 0
                            }));
                        }
                    } else if (Array.isArray(data.ReactionEmojis)) {
                        incomingReactions = data.ReactionEmojis;
                    }
                }

                // For backward compatibility with old reaction format
                if (data.ReactionEmojis && typeof data.ReactionEmojis === 'string' &&
                    !data.ReactionEmojis.startsWith('[') && data.ReactionEmojis.includes(',')) {
                    // Old comma-separated format
                    incomingReactions = data.ReactionEmojis.split(',').filter(r => r).map((reaction, index) => ({
                        Reaction: reaction,
                        Direction: index === 0 ? 1 : 0 // First = agent, second = client
                    }));
                }

                // Merge reactions: for incoming reactions, we replace existing reactions from the same direction
                const incomingDirections = incomingReactions.map(r => r.Direction);
                const filteredExistingReactions = updatedReactions.filter(reaction =>
                    !incomingDirections.includes(reaction.Direction)
                );

                const finalReactions = [...filteredExistingReactions, ...incomingReactions];
                const reactionsString = JSON.stringify(finalReactions);

                // Update the message entry
                updatedData[existingMsgIndex] = {
                    ...existingMsg,
                    ...data,
                    ReactionEmojis: reactionsString,
                    SenderInfo: existingMsg.SenderInfo || data.SenderInfo,
                };

                return {
                    ...prevMessages,
                    data: updatedData,
                };
            } else {
                // 🆕 New message or new reaction-only message
                // Ensure ReactionEmojis is in the correct format
                let reactionEmojis = data.ReactionEmojis || "[]";

                // If it's a string but not JSON, convert it
                if (typeof reactionEmojis === 'string' && !reactionEmojis.startsWith('[')) {
                    if (reactionEmojis.includes(',')) {
                        // Old comma-separated format
                        const reactionsArray = reactionEmojis.split(',').filter(r => r).map((reaction, index) => ({
                            Reaction: reaction,
                            Direction: index === 0 ? 1 : 0 // First = agent, second = client
                        }));
                        reactionEmojis = JSON.stringify(reactionsArray);
                    } else if (reactionEmojis) {
                        // Single reaction, assume it's from client (Direction: 0)
                        reactionEmojis = JSON.stringify([{ Reaction: reactionEmojis, Direction: 0 }]);
                    } else {
                        reactionEmojis = "[]";
                    }
                }

                const messageWithReactions = {
                    ...data,
                    ReactionEmojis: reactionEmojis,
                };
                return {
                    ...prevMessages,
                    data: [...prevData, messageWithReactions],
                };
            }
        });
    };

    const handleReactionMessage = (data) => {
        console.log("TCL: handleReactionMessage -> data", data);

        // Skip if this is the current user's own reaction (handled by handleMessageEmojiClick)
        if (data._isFromCurrentUser) {
            return; // Skip processing as this is already handled by handleMessageEmojiClick
        }

        // Instead of using addUniqueMessage which has issues with reaction processing,
        // directly update the message with the new reaction emojis
        setMessages((prevMessages) => {
            const prevData = Array.isArray(prevMessages)
                ? prevMessages
                : prevMessages?.data || [];

            // Find the message by MessageId
            const existingMsgIndex = prevData.findIndex(msg =>
                msg?.MessageId === data?.MessageId
            );

            if (existingMsgIndex >= 0) {
                // Update existing message with new reaction emojis
                const updatedData = [...prevData];

                // Get current reactions
                let currentReactions = [];

                // Parse existing reactions if they exist
                if (updatedData[existingMsgIndex].ReactionEmojis) {
                    if (typeof updatedData[existingMsgIndex].ReactionEmojis === 'string') {
                        try {
                            currentReactions = JSON.parse(updatedData[existingMsgIndex].ReactionEmojis);
                        } catch (e) {
                            // If parsing fails, treat as comma-separated string
                            currentReactions = updatedData[existingMsgIndex].ReactionEmojis.split(',').map(reaction => ({
                                Reaction: reaction,
                                Direction: 0 // Default to client direction for backward compatibility
                            }));
                        }
                    } else if (Array.isArray(updatedData[existingMsgIndex].ReactionEmojis)) {
                        currentReactions = updatedData[existingMsgIndex].ReactionEmojis;
                    }
                }

                // Parse incoming reactions
                let incomingReactions = [];
                if (data.ReactionEmojis) {
                    if (typeof data.ReactionEmojis === 'string') {
                        try {
                            incomingReactions = JSON.parse(data.ReactionEmojis);
                        } catch (e) {
                            // If parsing fails, treat as a single reaction string
                            incomingReactions = [{
                                Reaction: data.ReactionEmojis,
                                Direction: 0 // Client reactions have Direction: 0
                            }];
                        }
                    } else if (Array.isArray(data.ReactionEmojis)) {
                        incomingReactions = data.ReactionEmojis;
                    }
                }

                // Create a map to store reactions by direction to prevent duplicates
                const reactionsByDirection = new Map();

                // First add all current non-client reactions
                currentReactions.forEach(reaction => {
                    if (reaction.Direction !== 0) {
                        reactionsByDirection.set(reaction.Direction, reaction);
                    }
                });

                // Then add/update with incoming reactions
                incomingReactions.forEach(reaction => {
                    // For client reactions (Direction: 0), we want to keep all of them
                    // For other directions (like agent reactions), we'll keep the latest one
                    if (reaction.Direction === 0) {
                        // For client reactions, use a composite key to allow multiple reactions
                        const key = `${reaction.Direction}-${reaction.Reaction}`;
                        reactionsByDirection.set(key, reaction);
                    } else {
                        // For non-client reactions (like agent reactions), only keep one per direction
                        reactionsByDirection.set(reaction.Direction, reaction);
                    }
                });

                // Convert back to array
                const updatedReactions = Array.from(reactionsByDirection.values());

                // Convert to JSON string for storage
                const reactionsString = JSON.stringify(updatedReactions);

                updatedData[existingMsgIndex] = {
                    ...updatedData[existingMsgIndex],
                    ReactionEmojis: reactionsString
                };

                return Array.isArray(prevMessages)
                    ? updatedData
                    : { ...prevMessages, data: updatedData };
            }

            // If message doesn't exist, add it as a new message
            const messageWithReactions = {
                ...data,
                ReactionEmojis: data.ReactionEmojis || "[]",
            };

            return Array.isArray(prevMessages)
                ? [...prevData, messageWithReactions]
                : { ...prevMessages, data: [...prevData, messageWithReactions] };
        });
        scrollToBottom();
    };

    useEffect(() => {
        // Only set up socket listeners if authenticated and socket is connected
        if (!auth?.token || !auth?.userId) {
            // console.log("No auth token available in Conversation, skipping socket setup");
            return;
        }

        // Handler for status changes - only update when backend sends status changes
        const handleChangeStatus = (data) => {
            console.log("TCL: handleChangeStatus -> data", data);
            if (!data || typeof data !== "object") return;

            setTempConversationId(data?.ConversationId);
            const currentSelectedCustomer = selectedCustomerRef.current;

            setMessages((prevMessages) => {
                const prevData = Array.isArray(prevMessages) ? prevMessages : prevMessages?.data || [];

                // Check if message already exists

                const messageExists = (msg) => {
                    // Match by message ID or by content + timestamp if ID is not available
                    return (
                        msg?.Id === data?.Id ||
                        msg?.id === data?.id ||
                        msg?.messageId === data?.messageId ||
                        (msg?.Message === data?.Message &&
                            msg?.Direction === 1 &&
                            Math.abs(new Date(msg?.DateTime || msg?.dateTime) - new Date(data?.DateTime || data?.dateTime)) < 60000)
                    );
                };

                // Only process messages that exist and are outbound (sent by current user)
                return {
                    ...prevMessages,
                    data: prevData.map((msg) => {
                        // Skip if not the target message or not an outbound message
                        if (!messageExists(msg) || msg?.Direction !== 1) {
                            return msg;
                        }

                        const newStatus = parseInt(data.status ?? data.Status, 10);
                        const currentStatus = parseInt(msg.Status, 10);

                        // Status transition validation
                        const isValidTransition = (current, next) => {
                            // Allow same status update (idempotent)
                            if (current === next) return true;

                            // Define valid status transitions
                            const validTransitions = {
                                // Queue (0) can transition to any status
                                0: [1, 2, 3, 4],
                                // Sent (1) can transition to delivered, read, or failed
                                1: [2, 3, 4],
                                // Delivered (2) can transition to read or failed
                                2: [3, 4],
                                // Read (3) is a terminal state
                                3: [],
                                // Failed (4) is a terminal state
                                4: []
                            };

                            // If current status is not in the map, allow any transition (for backward compatibility)
                            if (!(current in validTransitions)) return true;

                            // Check if the transition is valid
                            return validTransitions[current].includes(next);
                        };

                        // Only update if it's a valid status transition
                        if (isValidTransition(isNaN(currentStatus) ? 0 : currentStatus, newStatus)) {
                            return {
                                ...msg,
                                Status: newStatus,
                                // Preserve existing SenderInfo or use the one from status update
                                SenderInfo: msg.SenderInfo || data.SenderInfo,
                                // Update other relevant fields from the status update
                                ...(data.messageId && { messageId: data.messageId }),
                                ...(data.timestamp && { timestamp: data.timestamp }),
                                // Keep existing DateTime if not provided in status update
                                DateTime: data.DateTime || msg.DateTime
                            };
                        }

                        return msg;
                    })
                };
            });

            // Mark conversation as read if it's the current conversation
            if (currentSelectedCustomer?.ConversationId === data?.ConversationId) {
                handleReadMessage(data?.ConversationId);
            }
        };

        // Handler for new messages - only process when backend sends new messages
        const handleNewMessage = (data) => {
            console.log("TCL: handleNewMessage -> data", data)
            if (!data || typeof data !== 'object') return;
            addUniqueMessage(data);
            if (selectedCustomerRef.current?.ConversationId == data?.ConversationId) {
                handleReadMessage(data?.ConversationId);
            }
            scrollToBottom();
        };

        const handleNewMessageFromAssigningUser = (data) => {
            if (Number(data?.Sender) === auth?.id) return;
            addUniqueMessage(data);
            if (selectedCustomerRef.current?.ConversationId == data?.ConversationId) {
                handleReadMessage(data?.ConversationId);
            }
            scrollToBottom();
        };

        // Add handlers using the new optimized approach
        const removeMessageHandler = addMessageHandler(handleNewMessage);
        const removeStatusHandler = addStatusHandler(handleChangeStatus);
        const removeMessageHandlerFromAssigningUser = addMessageHandlerFromAssigningUser(handleNewMessageFromAssigningUser);
        const removeMessageReactionHandler = addMessageReactionHandler(handleReactionMessage);

        scrollToBottom();

        // Cleanup function
        return () => {
            removeMessageHandler();
            removeStatusHandler();
            removeMessageHandlerFromAssigningUser();
            removeMessageReactionHandler();
        };
    }, [auth?.token, auth?.userId]);

    const handleFetchtags = async () => {
        if (!selectedCustomer?.CustomerId) return;
        try {
            const response = await fetchTagsApi(selectedCustomer?.CustomerId, auth?.userId);
            setTagsList(response?.rd);
        } catch (error) {
            console.error("TCL: handleFetchtags -> error", error)
        }
    }

    const fetchAssigneeList = async () => {
        try {
            const response = await fetchAssignLists(auth?.userId);
            setAssigneeList(response?.rd);
        } catch (error) {
            console.error("TCL: handleFetchtags -> error", error)
        }
    }

    const handleAssigneeChange = (selectedValues) => {
        setSelectedAssignees(selectedValues)
    }

    const handleDeletetags = async (id) => {
        if (!selectedCustomer?.CustomerId) return;
        try {
            const response = await deleteAssignedTags(selectedCustomer?.CustomerId, id, auth?.userId);
            if (response?.rd?.[0]?.stat === 1) {
                toast.success("Tag deleted successfully");
                handleFetchtags();
                triggerRefetch(); // Trigger refetch in sidebar
            } else {
                toast.error("Tag deletion failed");
            }
        } catch (error) {
            console.error("TCL: handleDeletetags -> error", error)
        }
    }

    useEffect(() => {
        if (!selectedCustomer?.CustomerId) return;
        fetchAssigneeList()
    }, [selectedCustomer?.CustomerId]);

    useEffect(() => {
        if (!selectedCustomer?.CustomerId) return;
        handleFetchtags()
    }, [selectedCustomer?.CustomerId])

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleArchieveChat = async (member, shouldArchieve) => {
        if (!member?.ConversationId || !member?.UserId) {
            toast.error("Missing Conversation ID or User ID. Cannot archive/unarchive this chat.");
            return;
        }

        try {
            const response = shouldArchieve === "Archive"
                ? await archieveApi(member.ConversationId, member.UserId, auth?.userId)
                : await unArchieveApi(member.ConversationId, member.UserId, auth?.userId);

            if (response?.Status === "200") {
                toast.success(`Chat ${shouldArchieve === "Archive" ? 'archived' : 'unarchived'} successfully`);
                // loadMembers(currentPage, true);
            } else {
                toast.error(`Failed to ${shouldArchieve === "Archive" ? 'archive' : 'unarchive'} chat`);
            }
        } catch (error) {
            // console.error("Error handling favorite chat", error);
            toast.error("Something went wrong while archiving/unarchiving the chat.");
        }
    };

    const handleMenuAction = (action) => {
        if (action === "Close") {
            onCustomerSelect(null);
        }
        if (action === "Archive" || action === "UnArchive") {
            handleArchieveChat(selectedCustomer, action);
            onCustomerSelect(null);
        }
        handleCloseMessageMenu();
    };

    // Keep this outside the function but inside your component
    const latestRequestRef = useRef(0);
    const abortControllerRef = useRef(null);

    const loadConversation = useCallback(
        async (page = 1, reset = false) => {
            if (loading || !selectedCustomer?.ConversationId) return;

            // Create a unique request token
            const requestId = ++latestRequestRef.current;

            // 🛑 Abort any previous pending request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create new AbortController for this request
            const controller = new AbortController();
            abortControllerRef.current = controller;

            setLoading(true);

            try {
                const response = await conversationView(
                    selectedCustomer?.ConversationId,
                    page,
                    pageSize,
                    auth?.userId,
                    "ConvView",
                    controller.signal
                );

                // 🔒 Only update state if this request is still the latest one
                if (requestId !== latestRequestRef.current) {
                    console.log("🛑 Previous request aborted, ignoring response");
                    return;
                }

                const serverMessages = Array.isArray(response.data?.rd)
                    ? response.data.rd
                    : [];

                // setMessages((prevMessages) => {
                //     const prevData = reset ? [] : prevMessages?.data || [];

                //     // Preserve optimistic outbound messages
                //     const optimisticMessages = prevData.filter(
                //         (m) =>
                //             m &&
                //             m.Direction === 1 &&
                //             (m.status === "pending" || m.status === 3)
                //     );

                //     // Build a set of server message IDs for duplicate checking
                //     const serverIds = new Set(
                //         serverMessages
                //             .map((m) => m?.Id ?? m?.id)
                //             .filter((id) => id !== undefined && id !== null)
                //     );

                //     // Filter out optimistic messages already on the server
                //     const preservedOptimistic = optimisticMessages.filter((om) => {
                //         const optimisticId = om.Id ?? om.id;

                //         if (
                //             optimisticId !== undefined &&
                //             optimisticId !== null &&
                //             serverIds.has(optimisticId)
                //         ) {
                //             return false;
                //         }

                //         // Soft dedupe by Direction + Message + DateTime within 15 seconds
                //         const omTs = new Date(om.DateTime).getTime();
                //         const existsOnServer = serverMessages.some((sm) => {
                //             const smTs = new Date(sm?.DateTime).getTime();
                //             return (
                //                 sm?.Direction === om?.Direction &&
                //                 sm?.Message === om?.Message &&
                //                 Math.abs((smTs || 0) - (omTs || 0)) < 15000
                //             );
                //         });

                //         return !existsOnServer;
                //     });

                //     // Merge server + optimistic messages
                //     const merged = [...prevData, ...serverMessages, ...preservedOptimistic];

                //     // Sort ascending by DateTime
                //     merged.sort(
                //         (a, b) =>
                //             new Date(a?.DateTime).getTime() - new Date(b?.DateTime).getTime()
                //     );

                //     return { data: merged, total: response.total };
                // });

                setMessages((prevMessages) => {
                    const prevData = reset ? [] : prevMessages?.data || [];

                    // Preserve optimistic outbound messages
                    const optimisticMessages = prevData.filter(
                        (m) =>
                            m &&
                            m.Direction === 1 &&
                            (m.status === "pending" || m.status === 3)
                    );

                    // Create a new Map to store unique messages by ID
                    const messageMap = new Map();

                    // Helper function to safely get ID
                    const getId = (msg) => msg?.Id ?? msg?.id ?? `${msg?.Direction}_${msg?.Message}_${msg?.DateTime}`;

                    // Step 1: Add existing (previous) messages first
                    for (const msg of prevData) {
                        const id = getId(msg);
                        if (!messageMap.has(id)) messageMap.set(id, msg);
                    }

                    // Step 2: Add server messages — overwrite duplicates if server is more recent
                    for (const sm of serverMessages) {
                        const id = getId(sm);
                        const existing = messageMap.get(id);

                        // If already exists, compare timestamps — prefer newer
                        if (!existing || new Date(sm.DateTime) > new Date(existing.DateTime)) {
                            messageMap.set(id, sm);
                        }
                    }

                    // Step 3: Add preserved optimistic messages (avoid duplicates)
                    for (const om of optimisticMessages) {
                        const id = getId(om);
                        if (!messageMap.has(id)) {
                            // Soft dedupe check — similar message within 15s
                            const omTs = new Date(om.DateTime).getTime();
                            const existsOnServer = serverMessages.some((sm) => {
                                const smTs = new Date(sm?.DateTime).getTime();
                                return (
                                    sm?.Direction === om?.Direction &&
                                    sm?.Message === om?.Message &&
                                    Math.abs((smTs || 0) - (omTs || 0)) < 15000
                                );
                            });

                            if (!existsOnServer) messageMap.set(id, om);
                        }
                    }

                    // Step 4: Convert Map back to array and sort ascending
                    const merged = Array.from(messageMap.values()).sort(
                        (a, b) =>
                            new Date(a?.DateTime).getTime() - new Date(b?.DateTime).getTime()
                    );

                    return { data: merged, total: response.total };
                });

                // ✅ Only set pagination info if this is still latest request
                if (requestId === latestRequestRef.current) {
                    setHasMore(response.hasMore);
                    setCurrentPage(page);
                }

                // Extract media file data (optional)
                const fileData = serverMessages
                    .filter((item) => item?.MessageType !== "text")
                    .map((item) => ({
                        MessageType: item.MessageType,
                        MediaId: item.MediaUrl,
                    }));
            } catch (error) {
                if (error.name === "AbortError" || error.message === "AbortError") {
                    console.log("🛑 Previous request aborted");
                } else {
                    console.error("Error loading conversation:", error);
                }
            } finally {
                if (requestId === latestRequestRef.current) {
                    setLoading(false);
                }
            }
        },
        [loading, pageSize, selectedCustomer, auth?.userId]
    );

    const loadOlderMessages = useCallback(async () => {
        if (loadingOlder || !hasMore || !selectedCustomer?.ConversationId) return;

        // Create a unique request token for older messages as well
        const requestId = ++latestRequestRef.current;

        // 🛑 Abort any previous pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const nextPage = currentPage + 1;

        setLoadingOlder(true);
        const container = containerRef.current;
        // Save scroll position before loading
        const previousScrollHeight = container ? container.scrollHeight : 0;
        const previousScrollTop = container ? container.scrollTop : 0;

        try {
            const response = await conversationView(
                selectedCustomer?.ConversationId,
                nextPage,
                pageSize,
                auth?.userId,
                "ConvView",
                controller.signal // Pass the signal to cancel this request if needed
            );

            // 🔒 Only update state if this request is still the latest one
            if (requestId !== latestRequestRef.current) {
                console.log("🛑 Previous older messages request aborted, ignoring response");
                return;
            }

            const serverMessages = Array.isArray(response.data?.rd) ? response.data.rd : [];

            setMessages(prevMessages => {
                const prevData = Array.isArray(prevMessages?.data) ? prevMessages.data : [];

                // Prepend older messages to the beginning
                const merged = [...serverMessages, ...prevData];

                // Dedupe by Id/id or composite key
                const seen = new Set();
                const unique = [];
                for (const m of merged) {
                    const key = (m?.Id ?? m?.id ?? `${m?.Direction}-${m?.DateTime}-${m?.Message}`);
                    if (!seen.has(key)) {
                        seen.add(key);
                        unique.push(m);
                    }
                }

                // Sort ascending by DateTime
                unique.sort((a, b) => new Date(a?.DateTime).getTime() - new Date(b?.DateTime).getTime());

                return { data: unique, total: response.total };
            });

            setHasMore((serverMessages?.length || 0) === pageSize);
            setCurrentPage(nextPage);

            // Preserve scroll position after prepending older messages
            requestAnimationFrame(() => {
                if (container && previousScrollHeight) {
                    const newScrollHeight = container.scrollHeight;
                    const delta = newScrollHeight - previousScrollHeight;
                    container.scrollTop = previousScrollTop + delta;
                }
            });

        } catch (error) {
            if (error.name === "AbortError" || error.message === "AbortError") {
                console.log("🛑 Previous older messages request aborted");
            } else {
                console.error('Error loading older messages:', error);
            }
        } finally {
            // Only update loading state if this is still the latest request
            if (requestId === latestRequestRef.current) {
                setLoadingOlder(false);
            }
        }
    }, [loadingOlder, hasMore, selectedCustomer?.ConversationId, currentPage, pageSize, auth?.userId]);

    useEffect(() => {
        // If no selectedCustomer or no ConversationId, clear the conversation view
        if (!selectedCustomer || !selectedCustomer?.ConversationId) {
            setMessages({ data: [], total: 0 });
            setCurrentPage(1);
            setHasMore(true);
            setTempConversationId(null);
            return;
        }

        // Reset auto-scroll flag for new conversation
        isAutoScrollingRef.current = false;

        if (selectedCustomer?.ConversationId == tempConversationId) {
            loadConversation(currentPage, true);
            setCurrentPage(currentPage);
        } else {
            loadConversation(1, true);
            setCurrentPage(1);
        }
    }, [selectedCustomer]);

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

    const handleReadMessage = async (custConverId) => {
        if (!custConverId) return;
        const response = await readMessage(custConverId, auth?.userId);
        if (response?.rd) {
            return response?.rd;
        } else {
            return null;
        }
    }

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

    // Function to scroll to a specific message with blink effect
    const scrollToMessage = useCallback(async (messageId) => {
        if (!containerRef.current || !messageId) return;

        // Find the message element
        const messageElement = containerRef.current.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            // Scroll to the message
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add blink effect
            setBlinkMessageId(messageId);
            setTimeout(() => {
                setBlinkMessageId(null);
            }, 3000); // Remove blink effect after 3 seconds
        } else {
            // If the message is not found in the current view, try to load more messages
            toast.loading('Searching for original message...');

            // Try to load more messages to find the original
            try {
                // This is a simplified approach - in a real implementation, you might need to:
                // 1. Call an API to fetch messages around the target ID
                // 2. Or load messages page by page until the message is found
                // For now, we'll just show an informative message
                toast.dismiss();
                toast.error('Original message not found in conversation history');
            } catch (error) {
                toast.dismiss();
                toast.error('Failed to locate original message');
                console.error('Error searching for message:', error);
            }
        }
    }, []);

    const handleMediaClick = (message, index) => {
        if (message.mediaItems && message.mediaItems.length > 0) {
            const mediaItems = message.mediaItems.map(item => ({
                src: item.url,
                type: item.mimeType?.startsWith('image/') ? 'image' : 'video',
                name: item.filename || 'Media',
                mimeType: item.mimeType
            }));
            setMediaViewerItems(mediaItems);
            setMediaViewerIndex(index);
            setMediaViewerOpen(true);
        }
    };

    const phoneNumber = selectedCustomer?.CustomerPhone?.replace(/\D/g, "");

    const handleSendMessage = async () => {
        // Don't send if there's no content

        const isoString = new Date().toISOString();
        const istTime = new Date(isoString).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata"
        });
        const caption = inputValue.trim();

        // If there are media files, upload and send them like WhatsApp with caption
        if (mediaFiles && mediaFiles.length > 0) {
            const filesToSend = [...mediaFiles];
            // Clear inputs and hide media picker before starting upload
            setInputValue('');
            setShowMedia(false);
            setMediaFiles([]);

            try {
                for (const file of filesToSend) {
                    const previewUrl = URL.createObjectURL(file);
                    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document';
                    const tempId = `${Date.now()}-${file.name}`;
                    const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

                    // Optimistic bubble in chat
                    const tempMsg = {
                        Id: tempId,
                        Direction: 1,
                        Status: 'pending',
                        MessageType: type,
                        previewUrl,
                        Message: caption,
                        isUploading: true,
                        percent: 0,
                        dateTime: istTime,
                        Time: istTime,
                        Date: istNow.toISOString().split('T')[0],
                        ConversationId: selectedCustomer?.ConversationId || tempConversationId,
                    };
                    setMessages(prev => {
                        const prevData = Array.isArray(prev) ? prev : (prev?.data || []);
                        return { data: [...prevData, tempMsg], total: (prev?.total || 0) + 1 };
                    });

                    // Upload with live progress
                    let uploadedId = null;
                    try {
                        const uploadResp = await UploadMedia(file, auth?.whatsappNumber, auth?.whatsappKey, (percent) => {
                            setUploadProgress(prev => ({
                                ...prev,
                                [file.name]: { percent, previewUrl, type }
                            }));
                            // reflect progress into the optimistic bubble
                            setMessages(prev => {
                                const prevData = Array.isArray(prev) ? prev : (prev?.data || []);
                                return { data: prevData.map(m => m.Id === tempId ? { ...m, isUploading: true, percent: Math.max(0, Math.min(99, percent)) } : m), total: prev?.total || 0 };
                            });
                        });
                        uploadedId = uploadResp?.data?.id ?? uploadResp?.rd?.id ?? uploadResp?.id ?? uploadResp?.rd?.mediaId ?? uploadResp?.mediaId ?? null;
                    } catch (e) {
                        console.error('Upload failed:', e);
                        toast.error('Failed to upload media');
                        setUploadProgress(prev => {
                            const copy = { ...prev };
                            delete copy[file.name];
                            return copy;
                        });
                        // mark bubble as failed
                        setMessages(prev => {
                            const prevData = Array.isArray(prev) ? prev : (prev?.data || []);
                            return { data: prevData.map(m => m.Id === tempId ? { ...m, Status: 3 } : m), total: prev?.total || 0 };
                        });
                        continue;
                    }

                    if (!uploadedId) {
                        toast.error('Upload did not return media id');
                        setUploadProgress(prev => {
                            const copy = { ...prev };
                            delete copy[file.name];
                            return copy;
                        });
                        // mark bubble as failed
                        setMessages(prev => {
                            const prevData = Array.isArray(prev) ? prev : (prev?.data || []);
                            return { data: prevData.map(m => m.Id === tempId ? { ...m, Status: 3 } : m), total: prev?.total || 0 };
                        });
                        continue;
                    }

                    // Send media with caption
                    try {
                        const sendResp = await sendMedia(type, phoneNumber, uploadedId, caption, type, auth?.userId, selectedCustomer?.CustomerId, auth?.whatsappNumber);

                        if (!sendResp) {
                            toast.error('Failed to send media');
                            // keep bubble but mark failed
                            setMessages(prev => {
                                const prevData = Array.isArray(prev) ? prev : (prev?.data || []);
                                return { data: prevData.map(m => m.Id === tempId ? { ...m, Status: 3, isUploading: false } : m), total: prev?.total || 0 };
                            });
                        } else {
                            // Fetch the actual media from MediaApi using uploadedId
                            try {
                                const blob = await MediaApi(auth?.whatsappKey, auth?.whatsappNumber, uploadedId); // fetch the uploaded media
                                const objectUrl = URL.createObjectURL(blob);

                                // Update message bubble with actual media and remove uploading state
                                setMessages(prev => {
                                    const prevData = Array.isArray(prev) ? prev : (prev?.data || []);
                                    return {
                                        data: prevData.map(m =>
                                            m.Id === tempId
                                                ? { ...m, previewUrl: objectUrl, isUploading: false }
                                                : m
                                        ),
                                        total: prev?.total || 0
                                    };
                                });
                            } catch (err) {
                                console.error('Media fetch failed:', err);
                                toast.error('Failed to fetch uploaded media');
                                setMessages(prev => {
                                    const prevData = Array.isArray(prev) ? prev : (prev?.data || []);
                                    return { data: prevData.map(m => m.Id === tempId ? { ...m, isUploading: false, Status: 3 } : m), total: prev?.total || 0 };
                                });
                            }
                        }
                    } catch (e) {
                        console.error('Send media failed:', e);
                        toast.error('Failed to send media');
                        // mark bubble as failed
                        setMessages(prev => {
                            const prevData = Array.isArray(prev) ? prev : (prev?.data || []);
                            return { data: prevData.map(m => m.Id === tempId ? { ...m, Status: 3, isUploading: false } : m), total: prev?.total || 0 };
                        });
                    } finally {
                        // Ensure final 100% on optimistic bubble, then cleanup progress entry
                        setMessages(prev => {
                            const prevData = Array.isArray(prev) ? prev : (prev?.data || []);
                            return { data: prevData.map(m => m.Id === tempId ? { ...m, percent: 100 } : m), total: prev?.total || 0 };
                        });
                        setTimeout(() => {
                            setUploadProgress(prev => {
                                const copy = { ...prev };
                                delete copy[file.name];
                                return copy;
                            });
                        }, 150);

                    }
                }
            } finally {
                scrollToBottom();
            }
            return;
        }

        // Text-only message flow (optimistic update then send)
        const tempId = Date.now();
        const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const newMessage = {
            Id: tempId,
            Message: caption,
            dateTime: istTime,
            Time: istTime,
            Date: istNow.toISOString().split('T')[0],
            Direction: 1,
            Status: 'pending',
            MessageType: 'text',
            ConversationId: selectedCustomer?.ConversationId || tempConversationId,
            // Add reply context if replying to a message
            ...(replyToMessage && {
                ContextType: 2,
                ReplyContextMsg: replyToMessage.text,
                ContextId: replyToMessage.Id, // Add the original message ID
                Sender: auth?.userId
            })
        };

        setMessages(prev => {
            const prevData = Array.isArray(prev) ? prev : (prev?.data || []);
            return { data: [...prevData, newMessage], total: (prev?.total || 0) + 1 };
        });
        setInputValue('');
        setReplyToMessage(null); // Clear reply after sending

        if (replyToMessage) {
            try {
                const api = await replyTo(auth?.userId, selectedCustomer?.CustomerId, selectedCustomer?.CustomerPhone, "text", 2, storeMessData?.messageId, false, caption);

                const response = await api.json();

                if (response?.success === true) {
                    toast.success("Message replied successfully");
                } else {
                    toast.error("Failed to reply message");
                }

            } catch (error) {
                toast.error("Error in reply to", error);
            }
        } else {
            try {
                const response = await sendText(phoneNumber, caption, auth?.userId, selectedCustomer?.CustomerId);
                if (response?.rd) {
                    setMessages(prev => {
                        const prevData = Array.isArray(prev) ? prev : (prev?.data || []);
                        const updatedData = prevData.map(msg =>
                            msg?.Id === tempId ? { ...msg, Status: 0, Id: response.rd.messageId } : msg
                        );
                        return { data: updatedData, total: prev?.total || 0 };
                    });
                }
            } catch (error) {
                toast.error("error in send text", error);
                setMessages(prev => {
                    const prevData = Array.isArray(prev) ? prev : (prev?.data || []);
                    const updatedData = prevData.map(msg =>
                        msg?.Id === tempId ? { ...msg, Status: 3 } : msg
                    );
                    return { data: updatedData, total: prev?.total || 0 };
                });
            } finally {
                scrollToBottom();
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputValue.trim() || (mediaFiles && mediaFiles.length > 0)) {
                handleSendMessage();
                setInputValue("");
            }
        }
    };

    // Toggle emoji picker for input field
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

    // Message context menu handlers
    const handleContextMenu = (event, message) => {
        event.preventDefault();
        setMessageContextMenu(
            messageContextMenu === null
                ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4, message }
                : null
        );
    };

    const handleForward = (message, event) => {
        if (event) {
            event.stopPropagation();
            setForwardMessage(message);
            setForwardAnchorEl(event.currentTarget);
        }
    };

    const handleCloseForward = () => {
        setForwardAnchorEl(null);
        setForwardMessage(null);
    };

    const handleSendForward = async (selectedContacts) => {
        if (!selectedContacts?.length || !forwardMessage) {
            toast.error("Please select at least one contact to forward the message.");
            return;
        }

        try {

            const response = await forwardTo(
                auth?.userId,
                selectedContacts,
                "text",
                1,
                forwardMessage?.MessageId,
                false,
                forwardMessage?.Message
            );

            if (response?.success === true) {
                toast.success("Message forwarded successfully");
            } else {
                toast.error("Failed to forward message");
            }

            handleCloseForward();
        } catch (error) {
            console.error("Error in forwarding message:", error);
            toast.error("Something went wrong while forwarding");
        }
    };

    const handleCloseMessageContextMenu = () => {
        setMessageContextMenu(null);
    };

    // Reply handlers
    const handleReply = async (message) => {
        setStoreMessData({
            messageId: message?.MessageId,
        })

        setReplyToMessage({
            Id: message.Id,
            sender: message.Direction === 1 ? 'You' : selectedCustomer?.name || 'Customer',
            text: message.Message || 'Media',
            MessageType: message.MessageType
        });
        handleCloseMessageContextMenu();
    };

    const handleCancelReply = () => {
        setReplyToMessage(null);
    };

    const groupMessagesByDate = useMemo(() => {
        const grouped = {};

        // Handle messages as either array or object with property
        const messagesArray = Array.isArray(messages) ? messages : (messages?.data || []);

        messagesArray.forEach(msg => {
            let date;

            // Handle different date formats and ensure proper grouping
            if (msg?.Date) {
                // If message has a Date field, use it
                date = msg?.Date;
            } else if (msg?.DateTime) {
                // If no Date field, extract date from DateTime
                // date = new Date(msg?.DateTime).toISOString().split('T')[0];
                date = new Date(msg?.DateTime).toLocaleDateString('en-GB', { timeZone: 'GMT' });
            } else {
                // Fallback to current date
                date = new Date().toLocaleDateString('en-GB', { timeZone: 'GMT' });
            }

            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(msg);
        });

        // Sort dates to ensure proper order
        const sortedDates = Object.keys(grouped).sort();
        const sortedGrouped = {};
        sortedDates.forEach(date => {
            sortedGrouped[date] = grouped[date];
        });

        return sortedGrouped;
    }, [messages]);

    const getMessageStatusIcon = (msg) => {
        const status = typeof msg?.Status === 'number' ? msg.Status :
            (msg?.Status === 'pending' ? 0 : -1);

        // Status mapping:
        // 0 - Queue (sending/queued)
        // 1 - Sent
        // 2 - Delivered
        // 3 - Read
        // 4 - Failed

        // Show clock for messages that are queued/sending (0) or pending
        if (status === 0 || msg?.Status === 'pending') {
            return (
                <Typography variant="caption" sx={{ color: '#fff', ml: 0.5 }}>
                    <Clock3 size={18} />
                </Typography>
            );
        }

        // Failed status (4)
        if (status === 4) {
            return (
                <Typography variant="caption" sx={{ color: '#ff4444', ml: 0.5 }}>
                    {/* ❗ */}
                    <AlertCircle size={18} style={{ color: "#ff4444", marginTop: "2px" }} />
                </Typography>
            );
        }

        // Read status (3) - Double yellow tick
        if (status === 3) {
            return (
                <Typography variant="caption" sx={{ color: '#ffef00', fontWeight: "bold", ml: 0.5 }}>
                    {/* ✓✓ */}
                    <CheckCheck size={18} style={{ color: "#ffef00", marginTop: "2px" }} />
                </Typography>
            );
        }

        // Delivered status (2) - Double grey tick
        if (status === 2) {
            return (
                <Typography variant="caption" sx={{ color: '#fff', ml: 0.5 }}>
                    {/* ✓✓ */}
                    <CheckCheck size={18} style={{ color: "#fff", marginTop: "2px" }} />
                </Typography>
            );
        }

        // Sent status (1) - Single grey tick
        if (status === 1) {
            return (
                <Typography variant="caption" sx={{ color: '#fff', ml: 0.5 }}>
                    {/* ✓ */}
                    <Check size={18} style={{ color: "#fff", marginTop: "2px" }} />
                </Typography>
            );
        }

        return null; // No status to display
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
                    {/* <Avatar
                        src={selectedCustomer.avatar}
                        alt={selectedCustomer.name}
                        sx={{ width: 40, height: 40, mr: 2, cursor: "pointer" }}
                        onClick={() => setDrawerOpen(true)}
                    /> */}
                    <div style={{ width: 40, height: 40, marginRight: 10, cursor: "pointer" }}>
                        <Avatar
                            {...(selectedCustomer?.avatarConfig || {})}
                            onClick={() => setDrawerOpen(true)}
                        // sx={{ width: 40, height: 40, mr: 2, cursor: 'pointer' }}
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
                                    // backgroundColor: tag.color || '#e0f2f1',
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
                    {/* <IconButton size="small" className="header-action">
                        <MoreVert />
                    </IconButton> */}
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

            {/* Messages Area */}
            <div
                className="messages-area"
                style={{
                    position: "relative",
                    ...(showMedia && {
                        "::before": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            pointerEvents: "none",
                            zIndex: 1,
                        },
                    }),
                }}
                onContextMenu={(e) => {
                    e.preventDefault();

                    if (can(8)) {
                        setContextMenu({
                            mouseX: e.clientX + 2,
                            mouseY: e.clientY + 2,
                        });
                    }
                }}
            >
                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            minHeight: '300px',
                            gap: 2
                        }}
                    >
                        <CircularProgress size={50} thickness={4} />
                        <Typography variant="body1" color="textSecondary">
                            Loading conversation...
                        </Typography>
                    </Box>
                ) : mediaFiles?.length > 0 ? (
                    <MediaPreview mediaFiles={mediaFiles} setMediaFiles={setMediaFiles} handleClosePreview={handleClosePreview} />
                ) : (
                    <>
                        <div
                            className="messages-list"
                            ref={containerRef}
                            style={{
                                maxHeight: '100vh',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                transition: 'filter 0.3s ease-in-out',
                                position: 'relative',
                                backgroundImage: 'url(/bg-3.jpg)',
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'repeat',
                                backgroundAttachment: 'fixed',
                            }}
                        >
                            {showScrollToBottom && (
                                <div
                                    className="scroll-to-bottom"
                                    onClick={() => scrollToBottom()}
                                    title="Scroll to bottom"
                                    style={{
                                        position: 'fixed',
                                        bottom: '100px',
                                        right: '30px',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: 'white',
                                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 1000,
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    <ChevronDownCircle size={40} color="#8e4ff3" />
                                </div>
                            )}

                            {loadingOlder && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '20px',
                                    borderBottom: '1px solid #e0e0e0',
                                    gap: '15px',
                                }}>
                                    <CircularProgress size={35} />
                                    <Typography variant="body2" color="textSecondary">
                                        Loading messages...
                                    </Typography>
                                </div>
                            )}

                            {Object.entries(groupMessagesByDate).map(([date, dateMessages], dateIdx, allDates) => {
                                return (
                                    <>
                                        {dateMessages?.some(
                                            message =>
                                                (message.Direction === 0 && message.ConversationId == selectedCustomer?.ConversationId) ||
                                                message.Direction === 1
                                        ) && (
                                                <div key={date} className="date-group">
                                                    <div className="date-header" style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        margin: '20px 0 10px 0'
                                                    }}>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                backgroundColor: '#d6d6d6ff',
                                                                padding: '4px 12px',
                                                                borderRadius: '12px',
                                                                color: '#000',
                                                                fontSize: '12px'
                                                            }}
                                                        >
                                                            {formatDateHeader(date)}
                                                        </Typography>
                                                    </div>

                                                    {dateMessages
                                                        ?.filter(message =>
                                                            (message.Direction === 0 && message.ConversationId == selectedCustomer?.ConversationId) ||
                                                            message.Direction === 1
                                                        )
                                                        .map((msg, index) => {
                                                            return (
                                                                <div
                                                                    key={msg.Id ?? msg.fileName}
                                                                    className={`message-item ${msg.Direction === 1 ? 'user-message' : 'customer-message'}`}
                                                                    style={{ cursor: 'context-menu' }}
                                                                    data-message-id={msg.Id ?? msg.fileName}
                                                                >
                                                                    {msg.Direction === 0 && (
                                                                        <Avatar src={'./avatar.jpg'} alt="Customer" sx={{ width: 32, height: 32, mr: 1 }} />
                                                                    )}

                                                                    <div className="message-content" style={{ flexDirection: 'column' }}
                                                                        onMouseEnter={() => setHoveredMessageId(msg?.messageId || msg?.id || index)}
                                                                        onMouseLeave={() => setHoveredMessageId(null)}
                                                                    >
                                                                        <div className={`message-bubble ${blinkMessageId === (msg.Id ?? msg.fileName) ? 'blink-message' : ''}`} style={{ display: msg?.MessageType === "text" ? 'flex' : "" }}>
                                                                            <div className="message-actions">
                                                                                <button className="reaction-btn" onClick={(e) => handleReactionClick(e, msg)}>
                                                                                    <SmilePlus size={16} />
                                                                                </button>
                                                                                <button
                                                                                    className="menu-btn"
                                                                                    onClick={(e) => {
                                                                                        handleMenuClick(e, msg);
                                                                                        handleContextMenu(e, msg);
                                                                                    }}
                                                                                >
                                                                                    <ChevronDown size={16} />
                                                                                </button>
                                                                            </div>

                                                                            {msg.ContextType === 2 && (
                                                                                <div className="">
                                                                                    <div className="reply-preview" style={{
                                                                                        display: 'flex',
                                                                                        flexDirection: "column",
                                                                                        gap: '8px',
                                                                                        padding: '8px',
                                                                                        backgroundColor: msg.Direction === 0 ? 'rgb(227 210 253)' : 'rgb(202 209 255 / 33%)',
                                                                                        borderRadius: '8px',
                                                                                        marginBottom: '8px',
                                                                                        borderLeft: msg.Direction === 0 ? '3px solid #8136fb' : '3px solid #fff',
                                                                                        cursor: msg.ContextId ? 'pointer' : 'default',
                                                                                        opacity: msg.ContextId ? 1 : 0.7
                                                                                    }}
                                                                                        onClick={() => msg.ContextId && scrollToMessage(msg.ContextId)}  // Jump to original message
                                                                                    >
                                                                                        <div className="reply-content" style={{ flex: 1 }}>
                                                                                            <div className="reply-sender" style={{
                                                                                                fontSize: '12px',
                                                                                                fontWeight: 600,
                                                                                                color: msg.Direction === 0 ? '#000' : '#fff',
                                                                                                marginBottom: '2px'
                                                                                            }}>
                                                                                                {msg.SenderInfo != '' ? msg.SenderInfo : msg.Sender}
                                                                                            </div>
                                                                                            <div className="reply-text" style={{
                                                                                                fontSize: '12px',
                                                                                                color: msg.Direction === 0 ? '#000' : '#fff',
                                                                                                overflow: 'hidden',
                                                                                                textOverflow: 'ellipsis',
                                                                                                whiteSpace: 'nowrap'
                                                                                            }}>
                                                                                                {msg?.ReplyContextMsg?.length > 50
                                                                                                    ? `${msg?.ReplyContextMsg.substring(0, 50)}...`
                                                                                                    : msg?.ReplyContextMsg}
                                                                                            </div>
                                                                                            {!msg.ContextId && (
                                                                                                <div className="original-not-available">
                                                                                                    Original message not available
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    {msg?.MessageType === "text" && (
                                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
                                                                                            <Typography variant="body2" className="message-text" style={{ flex: 1, marginRight: 0 }}>
                                                                                                {msg?.MessageType === 'template' ? "" : msg.Message}
                                                                                            </Typography>

                                                                                            <div className="message-status" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                                                                                <Typography variant="caption" className="message-time" sx={{ marginTop: '0 !important' }}>
                                                                                                    {msg.dateTime
                                                                                                        ? msg.dateTime
                                                                                                        : msg.DateTime && FormatDateIST(msg.DateTime, "dd-mm-yyyy").time}
                                                                                                </Typography>
                                                                                                {msg.Direction == 1 && !msg.isUploading && (
                                                                                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                                                                                        {getMessageStatusIcon(msg)}
                                                                                                    </Box>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                            {msg.ContextType !== 2 && msg?.MessageType === "text" && (
                                                                                <Typography variant="body2" className="message-text">
                                                                                    {msg?.MessageType === 'template' ? "" : msg.Message}
                                                                                </Typography>
                                                                            )}

                                                                            {msg?.MessageType === 'template' && (() => {
                                                                                const templateData = parseTemplateData(msg);
                                                                                return (
                                                                                    <DynamicTemplate
                                                                                        templateName={templateData.templateName}
                                                                                        params={templateData.params}
                                                                                        language={templateData.language}
                                                                                        components={templateData.components}
                                                                                    />
                                                                                );
                                                                            })()}

                                                                            {/* Image */}
                                                                            {msg?.MessageType === "image" && ((_, index) => {
                                                                                const mediaKey = getMediaKey(msg, index);
                                                                                const src = getMediaSrcForMessage(msg);
                                                                                return (
                                                                                    <div className="message-image" style={{ position: 'relative' }}>

                                                                                        {!loadedMedia[mediaKey] && (
                                                                                            <Skeleton
                                                                                                variant="rounded"
                                                                                                className="media-skeleton"
                                                                                                sx={{
                                                                                                    borderRadius: 1.5,
                                                                                                    width: "220px",
                                                                                                    height: "220px",
                                                                                                }}
                                                                                            />
                                                                                        )}

                                                                                        <div onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            e.preventDefault();
                                                                                            handleMediaClick({
                                                                                                mediaItems: [{
                                                                                                    url: src,
                                                                                                    mimeType: 'image/*',
                                                                                                    filename: 'image'
                                                                                                }]
                                                                                            }, 0);
                                                                                        }} style={{ cursor: 'pointer' }}>
                                                                                            <img
                                                                                                src={src}
                                                                                                alt="sent-img"
                                                                                                onLoad={() => markLoaded(mediaKey)}
                                                                                                onError={() => markLoaded(mediaKey)}
                                                                                                style={{ display: 'block', borderRadius: 12, opacity: loadedMedia[mediaKey] ? 1 : 0, maxWidth: '100%', height: 'auto' }}
                                                                                            />
                                                                                        </div>

                                                                                        {msg.isUploading && (
                                                                                            <div className="progress-overlay">
                                                                                                <svg className="progress-circle" viewBox="0 0 36 36">
                                                                                                    <path className="progress-bg" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                                                                    <path
                                                                                                        className="progress-bar"
                                                                                                        strokeDasharray={`${msg.percent}, 100`}
                                                                                                        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                                                    />
                                                                                                    <text x="18" y="20.35" className="progress-text">{msg.percent}%</text>
                                                                                                </svg>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })()}

                                                                            {msg?.MessageType === "video" && ((_, index) => {
                                                                                const mediaKey = getMediaKey(msg, index);
                                                                                const src = getMediaSrcForMessage(msg);
                                                                                return (
                                                                                    <div className="message-video" style={{ position: 'relative' }}>
                                                                                        {!loadedMedia[mediaKey] && (
                                                                                            <Skeleton
                                                                                                variant="rounded"
                                                                                                className="media-skeleton"
                                                                                                sx={{
                                                                                                    width: "220px",
                                                                                                    height: "220px",
                                                                                                }}
                                                                                            />
                                                                                        )}

                                                                                        <div onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            e.preventDefault();
                                                                                            handleMediaClick({
                                                                                                mediaItems: [{
                                                                                                    url: src,
                                                                                                    mimeType: 'video/*',
                                                                                                    filename: 'video'
                                                                                                }]
                                                                                            }, 0);
                                                                                        }} style={{ cursor: 'pointer' }}>
                                                                                            <video
                                                                                                src={src}
                                                                                                controls
                                                                                                onLoadedData={() => markLoaded(mediaKey)}
                                                                                                onError={() => markLoaded(mediaKey)}
                                                                                                style={{ borderRadius: 12, opacity: loadedMedia[mediaKey] ? 1 : 0, maxWidth: '100%' }}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            />
                                                                                        </div>

                                                                                        {msg.isUploading && (
                                                                                            <div className="progress-overlay">
                                                                                                <svg className="progress-circle" viewBox="0 0 36 36">
                                                                                                    <path className="progress-bg" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                                                                    <path className="progress-bar" strokeDasharray={`${msg.percent}, 100`} d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                                                                    <text x="18" y="20.35" className="progress-text">{msg.percent}%</text>
                                                                                                </svg>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })()}

                                                                            {msg?.MessageType === "document" && ((_, index) => {
                                                                                const href = getMediaSrcForMessage(msg);

                                                                                return (
                                                                                    <div className="message-document" style={{ position: 'relative' }}>
                                                                                        <div style={{
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            gap: "5px"
                                                                                        }}>
                                                                                            <div className="doc-icon">📄</div>
                                                                                            <div className="doc-info">
                                                                                                <span className="doc-name">{msg.fileName || "Document"}</span>
                                                                                                <span className="doc-type">{msg.fileType || "Unknown type"}</span>
                                                                                            </div>
                                                                                            <a
                                                                                                href={href}
                                                                                                download
                                                                                                className="doc-download"
                                                                                            >
                                                                                                <Download size={20} />
                                                                                            </a>
                                                                                        </div>

                                                                                        {msg.isUploading && (
                                                                                            <div className="progress-overlay">
                                                                                                <svg className="progress-circle" viewBox="0 0 36 36">
                                                                                                    <path className="progress-bg" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                                                                    <path className="progress-bar" strokeDasharray={`${msg.percent}, 100`} d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                                                                    <text x="18" y="20.35" className="progress-text">{msg.percent}%</text>
                                                                                                </svg>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })()}


                                                                            {msg?.MessageType !== 'text' && msg?.Message && (
                                                                                <Typography variant="body2" className="message-text" sx={{ mt: 0.5 }}>
                                                                                    {msg?.MessageType === 'template' ? "" : msg.Message}
                                                                                </Typography>
                                                                            )}

                                                                            {msg.ContextType !== 2 && (
                                                                                <div className="message-status">
                                                                                    <Typography variant="caption" className="message-time">
                                                                                        {msg.dateTime
                                                                                            ? msg.dateTime
                                                                                            : msg.DateTime && FormatDateIST(msg.DateTime, "dd-mm-yyyy").time}
                                                                                    </Typography>

                                                                                    {msg.Direction == 1 && !msg.isUploading && (
                                                                                        <Box sx={{ display: "flex", alignItems: "center", marginTop: 0.5 }}>
                                                                                            <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                                                                                                {getMessageStatusIcon(msg)}
                                                                                            </Box>
                                                                                        </Box>
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                            {msg?.ReactionEmojis && msg.ReactionEmojis !== "" && msg.ReactionEmojis !== "[]" && (
                                                                                <div className="message-reaction">
                                                                                    <span>
                                                                                        {(() => {
                                                                                            try {
                                                                                                const reactions = JSON.parse(msg.ReactionEmojis);

                                                                                                if (Array.isArray(reactions)) {
                                                                                                    return reactions.map(r => r.Reaction).join(" ");
                                                                                                }

                                                                                                return "";
                                                                                            } catch (e) {
                                                                                                console.error("ReactionEmojis parse error:", e);
                                                                                                return "";
                                                                                            }
                                                                                        })()}
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                        </div>
                                                                        {msg?.Direction == 1 && (
                                                                            <Box className="message-username-sendinfo" sx={{
                                                                                marginTop: msg?.Direction === 1 && msg?.ReactionEmojis && msg?.ReactionEmojis !== "" && msg.ReactionEmojis !== "[]" ? "20px" : "0px"
                                                                            }}>
                                                                                @{msg?.SenderInfo}
                                                                            </Box>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}

                                                </div>
                                            )}
                                    </>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </>
                )}
            </div>

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
                    handleFileChange={handleFileChange}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleKeyPress={handleKeyPress}
                    handleSendMessage={handleSendMessage}
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
                onSend={handleSendForward}
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
            {/* <MenuItem onClick={() => handleMenuItemClick(selectedCustomer?.IsArchived === 1 ? "UnArchive" : "Archive")}>
                📂 {selectedCustomer?.IsArchived === 1 ? "UnArchive" : "Archive"}
            </MenuItem> */}
        </Menu>
    );
};
