import { useState, useRef, useEffect, useCallback, useMemo, useContext } from 'react';
import { useTagsContext } from '../../contexts/TagsContexts';
import { conversationView } from '../../API/ConversationView/ConversationView';
import { sendText } from '../../API/SendText/SendText';
import { addMessageHandler, addMessageHandlerFromAssigningUser, addMessageReactionHandler, addStatusHandler } from '../../socket';
import { readMessage } from '../../API/ReadMessage/ReadMessage';
import { UploadMedia } from '../../API/InitialApi/UploadMedia';
import { sendMedia } from '../../API/SendMedia/SendMedia';
import { MediaApi } from '../../API/InitialApi/MediaApi';
import { toast } from 'react-hot-toast';
import { fetchTagsApi } from '../../API/FetchTags/FetchTagsApi';
import { deleteAssignedTags } from '../../API/DeleteAssignedTags/DeleteAssignedTags';
import { fetchAssignLists } from '../../API/AssignList/AssignListApi';
import { archieveApi } from '../../API/ArchieveAPi/ArchieveApi';
import { unArchieveApi } from '../../API/UnArchieveApi/UnArchieveApi';
import { replyTo } from '../../API/ReplyTo/ReplyTo';
import { forwardTo } from '../../API/ForwardTo/ForwardTo';
import { messageReaction } from '../../API/Reaction/Reaction';
import { LoginContext } from '../../context/LoginData';
import { formatDateHeader } from '../../utils/DateFnc';
import { fetchEscalatedLists } from '../../API/Escalated/EscalatedListApi';

export const useConversation = (selectedCustomer, onConversationRead, onViewConversationRead) => {
    const { tags, addTags, removeTags, triggerRefetch } = useTagsContext();
    const [inputValue, setInputValue] = useState("");
    const [tagsList, setTagsList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [tempConversationId, setTempConversationId] = useState(null);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [assigneeList, setAssigneeList] = useState([]);
    const [escalatedLists, setEscalatedLists] = useState([]);
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [selectedEscalated, setSelectedEscalate] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;
    const [loading, setLoading] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [uploadProgress, setUploadProgress] = useState({});
    const [mediaCache, setMediaCache] = useState({});
    const [loadedMedia, setLoadedMedia] = useState({});
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [messId, setMessId] = useState("");
    const [storeMessData, setStoreMessData] = useState({
        messageId: "",
    });
    const [forwardMessage, setForwardMessage] = useState(null);
    const [forwardAnchorEl, setForwardAnchorEl] = useState(null);
    const [blinkMessageId, setBlinkMessageId] = useState(null);
    const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
    const [mediaViewerItems, setMediaViewerItems] = useState([]);
    const [showMedia, setShowMedia] = useState(false);
    const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
    const { auth, PERMISSION_SET } = useContext(LoginContext);
    const selectedCustomerRef = useRef(selectedCustomer);
    const latestRequestRef = useRef(0);
    const switchAbortControllerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const debounceTimerRef = useRef(null);

    const can = (perm) => PERMISSION_SET.has(perm);

    // Update the ref when selectedCustomer changes
    useEffect(() => {
        selectedCustomerRef.current = selectedCustomer;
        // Clear media files when conversation changes
        setMediaFiles([]);
        setShowMedia(false);
    }, [selectedCustomer?.ConversationId]);

    const markLoaded = useCallback((key) => {
        setLoadedMedia(prev => ({ ...prev, [key]: true }));
    }, []);

    const getMediaKey = (msg, index) =>
        msg?.Id ?? msg?.id ?? msg?.mediaId ?? msg?.MediaUrl ?? msg?.fileName ?? `m-${index}`;

    const handleFetchtags = async (signal) => {
        if (!selectedCustomer?.CustomerId) return;
        try {
            const response = await fetchTagsApi(selectedCustomer?.CustomerId, auth?.userId, signal);
            setTagsList(response?.rd);
        } catch (error) {
            if (error.message !== 'AbortError') {
                console.error("TCL: handleFetchtags -> error", error);
            }
        }
    };

    const fetchAssigneeList = async (signal) => {
        try {
            const response = await fetchAssignLists(auth?.userId, signal);
            setAssigneeList(response?.rd || []);
        } catch (error) {
            if (error.message !== 'AbortError') {
                console.error("TCL: fetchAssigneeList -> error", error);
            }
        }
    };

    const fetchEscalatedList = async (signal) => {
        try {
            const response = await fetchEscalatedLists(auth?.userId, signal);
            setEscalatedLists(response?.rd1 || []);
        } catch (error) {
            if (error.message !== 'AbortError') {
                console.error("TCL: fetchEscalatedList -> error", error);
            }
        }
    };

    const handleDeletetags = async (id) => {
        if (!selectedCustomer?.CustomerId) return;
        try {
            const response = await deleteAssignedTags(selectedCustomer?.CustomerId, id, auth?.userId);
            if (response?.rd?.[0]?.stat === 1) {
                // Tag deleted successfully
                setTagsList((prev) => {
                    if (!Array.isArray(prev)) return prev;
                    return prev.filter((t) => String(t?.Id) !== String(id));
                });
            } else {
                // Tag deletion failed
                toast.error(response?.rd?.[0]?.stat_msg || 'Failed to delete tag');
            }
        } catch (error) {
            console.error("TCL: handleDeletetags -> error", error);
            toast.error('Failed to delete tag');
        }
    };

    // Use a unified effect for conversation switching with debouncing
    useEffect(() => {
        // Clear any pending debounce
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Cancel any pending requests
        if (switchAbortControllerRef.current) {
            switchAbortControllerRef.current.abort();
        }

        if (!selectedCustomer || !selectedCustomer?.ConversationId) {
            setMessages({ data: [], total: 0 });
            setTagsList([]);
            setCurrentPage(1);
            setHasMore(true);
            setTempConversationId(null);
            return;
        }

        // Set a debounce timer to wait for rapid clicks to settle
        debounceTimerRef.current = setTimeout(() => {
            const controller = new AbortController();
            switchAbortControllerRef.current = controller;
            const { signal } = controller;

            const isPageSame = selectedCustomer?.ConversationId == tempConversationId;
            const targetPage = isPageSame ? currentPage : 1;

            if (!isPageSame) {
                setTempConversationId(selectedCustomer.ConversationId);
                setCurrentPage(1);
            }

            // Fire all necessary APIs with the same signal
            loadConversation(targetPage, true, signal);
            handleFetchtags(signal);
            fetchAssigneeList(signal);
            fetchEscalatedList(signal);
        }, 200); // 200ms debounce

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [selectedCustomer?.ConversationId, selectedCustomer?.CustomerId]);

    const processedMessageIds = useRef(new Set());

    const addUniqueMessage = (data) => {
        const incomingId = data?.Id || data?.id || data?.MessageId;
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
                msg?.Id === incomingId || msg?.id === incomingId || msg?.MessageId === incomingId
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

                // Update the message entry with the new data and message ID
                updatedData[existingMsgIndex] = {
                    ...existingMsg,
                    ...data,
                    // Preserve the original ID if it exists and no new one is provided
                    Id: data.Id || existingMsg.Id || data.MessageId,
                    messageId: data.MessageId || existingMsg.MessageId,
                    ReactionEmojis: reactionsString,
                    SenderInfo: existingMsg.SenderInfo || data.SenderInfo,
                };

                return {
                    ...prevMessages,
                    data: updatedData,
                };
            } else {
                // New message or new reaction-only message
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
                    // Ensure we have both Id and messageId set
                    Id: data.Id || data.MessageId,
                    messageId: data.MessageId || data.Id,
                    ReactionEmojis: reactionEmojis,
                };

                // If this is a status update for an optimistic message, update the storeMessData
                if (data.MessageId) {
                    setStoreMessData(prev => ({
                        ...prev,
                        messageId: data.MessageId
                    }));
                }
                return {
                    ...prevMessages,
                    data: [...prevData, messageWithReactions],
                };
            }
        });
    };

    const handleReactionMessage = (data) => {
        // Skip if this is the current user's own reaction (handled by handleMessageEmojiClick)
        if (data._isFromCurrentUser) {
            return;
        }

        setMessages((prevMessages) => {
            const prevData = Array.isArray(prevMessages) ? prevMessages : prevMessages?.data || [];

            // Create a deep copy of the messages to avoid direct state mutation
            const updatedMessages = [...prevData];
            let messageUpdated = false;

            // Find and update the target message
            const updatedMessagesList = updatedMessages.map(msg => {
                if (msg?.MessageId === data?.MessageId) {
                    messageUpdated = true;

                    // Parse existing reactions
                    let existingReactions = [];
                    try {
                        existingReactions = msg.ReactionEmojis
                            ? JSON.parse(msg.ReactionEmojis)
                            : [];
                    } catch (e) {
                        console.error("Error parsing existing reactions:", e);
                        existingReactions = [];
                    }

                    // Parse incoming reactions
                    let newReactions = [];
                    try {
                        newReactions = data.ReactionEmojis
                            ? typeof data.ReactionEmojis === 'string'
                                ? JSON.parse(data.ReactionEmojis)
                                : data.ReactionEmojis
                            : [];
                    } catch (e) {
                        console.error("Error parsing new reactions:", e);
                        newReactions = [];
                    }

                    // Check if this is a reaction removal (empty Reaction for Direction: 0)
                    const isRemoval = newReactions.some(r =>
                        r.Direction === 0 && (!r.Reaction || r.Reaction === "")
                    );

                    if (isRemoval) {
                        // Remove all client reactions (Direction: 0)
                        const filteredReactions = existingReactions.filter(
                            r => r.Direction !== 0
                        );

                        return {
                            ...msg,
                            ReactionEmojis: JSON.stringify(filteredReactions)
                        };
                    }

                    // If no new reactions, return the message as is
                    if (newReactions.length === 0) {
                        return msg;
                    }

                    // Separate client reactions (Direction: 0) from other reactions
                    const nonClientReactions = existingReactions.filter(r => r.Direction !== 0);
                    let clientReactions = existingReactions.filter(r => r.Direction === 0);

                    // Process new reactions
                    newReactions.forEach(reaction => {
                        if (reaction.Direction === 0 && reaction.Reaction) {
                            // Check if this reaction already exists
                            const existingIndex = clientReactions.findIndex(
                                r => r.Reaction === reaction.Reaction
                            );

                            if (existingIndex >= 0) {
                                // Update existing reaction
                                clientReactions[existingIndex] = reaction;
                            } else {
                                // Add new reaction
                                clientReactions.push(reaction);
                            }
                        }
                    });

                    // Combine non-client reactions with updated client reactions
                    const mergedReactions = [...nonClientReactions, ...clientReactions];

                    return {
                        ...msg,
                        ReactionEmojis: JSON.stringify(mergedReactions)
                    };
                }
                return msg;
            });

            // If message wasn't found in existing messages and we have reactions to add
            if (!messageUpdated && data.ReactionEmojis) {
                try {
                    const newReactions = typeof data.ReactionEmojis === 'string'
                        ? JSON.parse(data.ReactionEmojis)
                        : data.ReactionEmojis;

                    // Filter out any empty reactions
                    const validReactions = newReactions.filter(
                        reaction => reaction.Reaction && reaction.Reaction.trim() !== ""
                    );

                    if (validReactions.length > 0) {
                        updatedMessagesList.push({
                            ...data,
                            ReactionEmojis: JSON.stringify(validReactions)
                        });
                    }
                } catch (e) {
                    console.error("Error processing new message with reactions:", e);
                }
            }

            return Array.isArray(prevMessages)
                ? updatedMessagesList
                : { ...prevMessages, data: updatedMessagesList };
        });
    };

    useEffect(() => {
        // Only set up socket listeners if authenticated and socket is connected
        if (!auth?.token || !auth?.userId) {
            return;
        }

        // Handler for status changes - only update when backend sends status changes
        const handleChangeStatus = (data) => {
            if (!data || typeof data !== "object") return;
            setMessId(data?.MessageId);

            // Store message data for later use
            if (data?.MessageId) {
                setStoreMessData(prev => ({
                    ...prev,
                    messageId: data.MessageId
                }));
            }

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
                        msg?.MessageId === data?.MessageId ||
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
                                ...(data.MessageId && { messageId: data.MessageId }),
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
            if (!data || typeof data !== 'object') return;
            if (selectedCustomerRef.current?.ConversationId == data?.ConversationId) {
                setMessId(data?.MessageId)
                addUniqueMessage(data);
                handleReadMessage(data?.ConversationId);
            }
        };

        const handleNewMessageFromAssigningUser = (data) => {
            if (Number(data?.Sender) === auth?.id) return;
            if (selectedCustomerRef.current?.ConversationId == data?.ConversationId) {
                setMessId(data?.MessageId)
                addUniqueMessage(data);
                handleReadMessage(data?.ConversationId);
            }
        };

        // Add handlers using the new optimized approach
        const removeMessageHandler = addMessageHandler(handleNewMessage);
        const removeStatusHandler = addStatusHandler(handleChangeStatus);
        const removeMessageHandlerFromAssigningUser = addMessageHandlerFromAssigningUser(handleNewMessageFromAssigningUser);
        const removeMessageReactionHandler = addMessageReactionHandler(handleReactionMessage);

        // Cleanup function
        return () => {
            removeMessageHandler();
            removeStatusHandler();
            removeMessageHandlerFromAssigningUser();
            removeMessageReactionHandler();
        };
    }, [auth?.token, auth?.userId]);

    const handleReadMessage = async (custConverId) => {
        if (!custConverId) return;
        const response = await readMessage(custConverId, auth?.userId);
        if (response?.rd) {
            return response?.rd;
        } else {
            return null;
        }
    };

    const loadConversation = useCallback(
        async (page = 1, reset = false, signal) => {
            if (!selectedCustomer?.ConversationId) return;

            const requestId = ++latestRequestRef.current;
            setLoading(true);

            try {
                const response = await conversationView(
                    selectedCustomer?.ConversationId,
                    page,
                    pageSize,
                    auth?.userId,
                    "ConvView",
                    signal
                );

                // Check if signal was aborted before processing
                if (signal?.aborted) return;

                const serverMessages = Array.isArray(response.data?.rd)
                    ? response.data.rd
                    : [];

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

                // Only set pagination info if this is still latest request
                if (requestId === latestRequestRef.current) {
                    setHasMore(response.hasMore);
                    setCurrentPage(page);
                }

            } catch (error) {
                if (error.name === "AbortError" || error.message === "AbortError") {
                } else {
                    console.error("Error loading conversation:", error);
                }
            } finally {
                if (requestId === latestRequestRef.current) {
                    setLoading(false);
                }
            }
        },
        [pageSize, selectedCustomer, auth?.userId]
    );

    const loadOlderMessages = useCallback(async (containerRef) => {
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
        // Save scroll position before loading
        const container = containerRef.current;
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
            // This is the WhatsApp-like behavior - scroll position is maintained
            requestAnimationFrame(() => {
                if (container && previousScrollHeight > 0) {
                    const newScrollHeight = container.scrollHeight;
                    const delta = newScrollHeight - previousScrollHeight;
                    container.scrollTop = previousScrollTop + delta;
                }
            });

        } catch (error) {
            if (error.name === "AbortError" || error.message === "AbortError") {
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

    // Optimized effect that only handles simple state resets
    useEffect(() => {
        if (!selectedCustomer || !selectedCustomer?.ConversationId) {
            setMessages({ data: [], total: 0 });
            setCurrentPage(1);
            setHasMore(true);
            setTempConversationId(null);
            return;
        }
    }, [selectedCustomer?.ConversationId]);

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
    }, [selectedCustomer?.ConversationId, onConversationRead, onViewConversationRead]);

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

    const handleAttachClick = (event) => {
        setShowMedia((prev) => !prev);
    };

    // Update the file upload handler
    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newMediaFiles = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('image/') ? 'image' :
                file.type.startsWith('video/') ? 'video' : 'file',
            name: file.name,
            size: file.size
        }));

        // Replace mediaFiles instead of appending to avoid duplicates
        setMediaFiles(newMediaFiles);
        setShowMedia(true);

        // Track upload progress with file names as keys for easier access
        const progressUpdates = {};

        newMediaFiles.forEach((media) => {
            progressUpdates[media.name] = {
                progress: 0,
                status: 'uploading'
            };
        });

        setUploadProgress(prev => ({ ...prev, ...progressUpdates }));
    };

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

    const handleClosePreview = () => {
        setMediaFiles([]);
        setShowMedia(false);
    };

    const handleSendMessage = async (containerRef, scrollToBottom) => {

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
                for (const mediaFile of filesToSend) {
                    // Handle the case where mediaFile might be a File object or have a file property
                    const file = mediaFile.file || mediaFile;

                    // Validate that we have a valid file object
                    if (!(file instanceof File)) {
                        console.error('Invalid file object:', file);
                        toast.error('Invalid file selected');
                        continue;
                    }

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
                    scrollToBottom();

                    // Upload with live progress
                    let uploadedId = null;
                    try {
                        const uploadResp = await UploadMedia(file, auth?.whatsappNumber, auth?.whatsappKey, (percent) => {
                            setUploadProgress(prev => ({
                                ...prev,
                                [file.name]: { progress: percent, status: percent === 100 ? 'completed' : 'uploading' }
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
                        const sendResp = await sendMedia(type, selectedCustomer?.CustomerPhone?.replace(/\D/g, ""), uploadedId, caption, type, auth?.userId, selectedCustomer?.CustomerId, auth?.whatsappNumber);

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
            messageId: messId,
            ConversationId: selectedCustomer?.ConversationId || tempConversationId,
            // messageId: messId,
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
        scrollToBottom();

        if (replyToMessage) {
            try {
                const api = await replyTo(auth?.userId, selectedCustomer?.CustomerId, selectedCustomer?.CustomerPhone, "text", 2, (storeMessData?.messageId || messId), false, caption);

                const response = await api.json();

                if (response?.success === true) {
                    // Message replied successfully
                } else {
                    // Failed to reply message
                }

            } catch (error) {
                // Error in reply to
            }
        } else {
            try {
                const response = await sendText(selectedCustomer?.CustomerPhone?.replace(/\D/g, ""), caption, auth?.userId, selectedCustomer?.CustomerId);
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

    const handleReply = async (message) => {
        setStoreMessData({
            messageId: message?.MessageId,
        });

        setReplyToMessage({
            Id: message.Id,
            sender: message.Direction === 1 ? 'You' : selectedCustomer?.name || 'Customer',
            text: message.Message || 'Media',
            MessageType: message.MessageType
        });
    };

    const handleCancelReply = () => {
        setReplyToMessage(null);
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
                (forwardMessage?.MessageId || messId),
                false,
                forwardMessage?.Message
            );

            if (response?.success === true) {
                toast.success("Message forwarded successfully");
            } else {
                const errorMessage = response?.error || "Failed to forward message";
                console.error("Forward API Error:", errorMessage);
                toast.error(errorMessage);
            }

            setForwardMessage(null);
        } catch (error) {
            console.error("Error in forwarding message:", error);
            const errorMessage = error?.response?.data?.error || error.message || "Something went wrong while forwarding";
            toast.error(errorMessage);
        }
    };

    const scrollToMessage = useCallback(async (messageId, containerRef) => {
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
        }
    }, []);

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
            return "Clock3";
        }

        // Failed status (4)
        if (status === 4) {
            return "AlertCircle";
        }

        // Read status (3) - Double yellow tick
        if (status === 3) {
            return "CheckCheckYellow";
        }

        // Delivered status (2) - Double grey tick
        if (status === 2) {
            return "CheckCheck";
        }

        // Sent status (1) - Single grey tick
        if (status === 1) {
            return "Check";
        }

        return null; // No status to display
    };

    return {
        // State
        inputValue,
        setInputValue,
        tagsList,
        setTagsList,
        messages,
        setMessages,
        mediaFiles,
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
        formatDateHeader,
        can



    };
};