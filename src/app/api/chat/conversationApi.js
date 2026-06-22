'use client';

import { CommonAPI } from '../CommonApi';
import { MESSAGEAPIURL, MESSAGEAPIURLBULK, getHeaders } from '../Config';
import { getUserData } from '../../utils/storage';

export const fetchConversationLists = async (page = 1, pageSize = 20, userId, search = '') => {
  try {
    const body = {
      con: `{"id":"","mode":"wa_list_conv","appuserid":"${userId || ''}"}`,
      p: `{"Page":${page},"PageSize":${pageSize},"SearchTerm": "${search}"}`,
      f: 'Chat ( List Conversation )',
    };

    const response = await CommonAPI(body);
    if (response?.Data?.rd || response?.Data?.rd[0]?.stat == 1) {
      const resultsArray = Array.isArray(response.Data)
        ? response.Data
        : (response.Data?.rd || []);
      return {
        data: response?.Data || [],
        total: response?.Data?.total || resultsArray.length || 0,
        currentPage: page,
        hasMore: resultsArray.length === pageSize,
      };
    }
    return { data: [], total: 0, currentPage: page, hasMore: false };
  } catch (error) {
    console.error('Error fetching conversation lists:', error);
    return { data: [], total: 0, currentPage: page, hasMore: false };
  }
};

export const fetchConversationView = async (conversationId, page = 1, pageSize = 10, userId, signal) => {
  try {
    const body = {
      con: `{"id":"","mode":"wa_list_chat","appuserid":"${userId || ''}"}`,
      p: `{"ConversationId": ${conversationId}, "Page": ${page}, "PageSize": ${pageSize} }`,
      f: 'Chat ( list )',
    };

    const response = await CommonAPI(body, signal);
    if (response?.Data) {
      return {
        data: response?.Data || [],
        total: response?.Data?.total || response?.Data?.rd?.length || 0,
        currentPage: page,
        hasMore: response?.Data?.rd?.length === pageSize,
      };
    }
    return { data: [], total: 0, currentPage: page, hasMore: false };
  } catch (error) {
    if (error.message === 'AbortError' || error.name === 'AbortError') throw error;
    console.error('Error fetching conversation view:', error);
    return { data: [], total: 0, currentPage: page, hasMore: false };
  }
};

export const sendChatText = async ({ phoneNo, message, userId, customerId }) => {
  const body = {
    userId: String(userId),
    customerId: String(customerId),
    phoneNo: String(phoneNo),
    type: 'text',
    text: { body: message },
  };

  try {
    const headers = getHeaders();
    const response = await fetch(MESSAGEAPIURL(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Send message API error:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

export const sendChatMedia = async ({ phoneNo, mediaUrl, type, caption, userId, customerId }) => {
  const body = {
    userId: String(userId),
    customerId: String(customerId),
    phoneNo: String(phoneNo),
    type,
    [type]: {
      link: mediaUrl,
      caption: caption || '',
    },
  };

  try {
    const headers = getHeaders();
    const response = await fetch(MESSAGEAPIURL(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Send media API error:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending media:', error);
    return null;
  }
};

export const fetchTags = async () => {
  const userData = getUserData() || {};
  const body = {
    con: JSON.stringify({
      id: '',
      mode: 'tagslist',
      appuserid: String(userData?.userId || ''),
    }),
    f: 'Chat module (tags list)',
    p: JSON.stringify({}),
  };

  const response = await CommonAPI(body);
  if (response?.Data?.rd) {
    return response.Data.rd;
  }
  return [];
};

export const fetchCustomerTags = async (customerId, userId, signal) => {
  try {
    const body = {
      con: JSON.stringify({
        id: '',
        mode: 'wa_list_tags',
        appuserid: String(userId || ''),
      }),
      p: JSON.stringify({ CustomerId: Number(customerId) }),
      f: 'WhatsApp Chat ( List Tags )',
    };
    const response = await CommonAPI(body, signal);
    if (response?.Data) {
      return response.Data;
    }
    return null;
  } catch (error) {
    if (error.message === 'AbortError' || error.name === 'AbortError') throw error;
    console.error('Error fetching customer tags:', error);
    return null;
  }
};

export const assignTag = async (conversationId, tagId) => {
  const userData = getUserData() || {};
  const body = {
    con: JSON.stringify({
      id: '',
      mode: 'assigntag',
      appuserid: String(userData?.userId || ''),
      conversationId: String(conversationId),
      tagId: String(tagId),
    }),
    f: 'Chat module (assign tag)',
    p: JSON.stringify({}),
  };

  return CommonAPI(body);
};

export const addTagsApi = async (customerId, tagName, userId) => {
  const body = {
    con: JSON.stringify({
      id: '',
      mode: 'wa_add_tags',
      appuserid: String(userId || ''),
    }),
    p: JSON.stringify({ CustomerId: Number(customerId), TagName: tagName }),
    f: 'WhatsApp Chat (Add Tags)',
  };

  try {
    const response = await CommonAPI(body);
    if (response?.Data) {
      return response.Data;
    }
    return null;
  } catch (error) {
    console.error('Error adding tag:', error);
    return null;
  }
};

export const pinConversationApi = async (conversationId, userId, email) => {
  try {
    const body = {
      con: `{"id":"","mode":"wa_bind_user_conv","appuserid":"${email || ''}"}`,
      p: `{"ConversationId": ${conversationId},"UserId": ${userId}, "UserBindConvField": "IsPin", "UserBindConvValue": 1}`,
      f: 'Conversation pin ( Pin )',
    };
    return await CommonAPI(body);
  } catch (error) {
    console.error('Error pinning conversation:', error);
    return null;
  }
};

export const unPinConversationApi = async (conversationId, userId, email) => {
  try {
    const body = {
      con: `{"id":"","mode":"wa_bind_user_conv","appuserid":"${email || ''}"}`,
      p: `{"ConversationId": ${conversationId},"UserId": ${userId}, "UserBindConvField": "IsPin", "UserBindConvValue": 0}`,
      f: 'Conversation pin ( Pin )',
    };
    return await CommonAPI(body);
  } catch (error) {
    console.error('Error unpinning conversation:', error);
    return null;
  }
};

export const favoriteApi = async (conversationId, userId, email) => {
  try {
    const body = {
      con: `{"id":"","mode":"wa_bind_user_conv","appuserid":"${email || ''}"}`,
      p: `{"ConversationId": ${conversationId},"UserId": ${userId}, "UserBindConvField": "IsStar", "UserBindConvValue": 1}`,
      f: 'Conversation Star ( star )',
    };
    return await CommonAPI(body);
  } catch (error) {
    console.error('Error favoriting conversation:', error);
    return null;
  }
};

export const unFavoriteApi = async (conversationId, userId, email) => {
  try {
    const body = {
      con: `{"id":"","mode":"wa_bind_user_conv","appuserid":"${email || ''}"}`,
      p: `{"ConversationId": ${conversationId},"UserId": ${userId}, "UserBindConvField": "IsStar", "UserBindConvValue": 0}`,
      f: 'Conversation Star ( star )',
    };
    return await CommonAPI(body);
  } catch (error) {
    console.error('Error unfavoriting conversation:', error);
    return null;
  }
};

export const archieveApi = async (conversationId, userId, email) => {
  try {
    const body = {
      con: `{"id":"","mode":"wa_bind_user_conv","appuserid":"${email || ''}"}`,
      p: `{"ConversationId": ${conversationId},"UserId": ${userId}, "UserBindConvField": "IsArchived", "UserBindConvValue": 1}`,
      f: 'Conversation Archived ( Archived )',
    };
    return await CommonAPI(body);
  } catch (error) {
    console.error('Error archiving conversation:', error);
    return null;
  }
};

export const unArchieveApi = async (conversationId, userId, email) => {
  try {
    const body = {
      con: `{"id":"","mode":"wa_bind_user_conv","appuserid":"${email || ''}"}`,
      p: `{"ConversationId": ${conversationId},"UserId": ${userId}, "UserBindConvField": "IsArchived", "UserBindConvValue": 0}`,
      f: 'Conversation Archived ( Archived )',
    };
    return await CommonAPI(body);
  } catch (error) {
    console.error('Error unarchiving conversation:', error);
    return null;
  }
};

export const fetchAgentLists = async (userId, signal) => {
  try {
    const body = {
      con: `{"id":"","mode":"wa_chat_agent_list","appuserid":"${userId || ''}"}`,
      p: '',
      f: 'Whatsapp Agent List ( List )',
    };
    const response = await CommonAPI(body, signal);
    if (response?.Data) {
      return response.Data;
    }
    return null;
  } catch (error) {
    if (error.message === 'AbortError' || error.name === 'AbortError') throw error;
    console.error('Error fetching agent lists:', error);
    return null;
  }
};

export const addAssignUser = async (conversationId, userId, email) => {
  try {
    const body = {
      con: `{"id":"","mode":"wa_assign_conv","appuserid":"${email || ''}"}`,
      p: `{"ConversationId": ${conversationId},"UserId": ${userId}, "IsAssign": 1, "AssignBy": 1}`,
      f: 'Assign Conversation to Agent ( Assign )',
    };
    const response = await CommonAPI(body);
    if (response?.Data) {
      return response.Data;
    }
    return null;
  } catch (error) {
    console.error('Error assigning user:', error);
    return null;
  }
};

export const removeAssignUser = async (conversationId, userId, email) => {
  try {
    const body = {
      con: `{"id":"","mode":"wa_assign_conv","appuserid":"${email || ''}"}`,
      p: `{"ConversationId": ${conversationId},"UserId": ${userId}, "IsAssign": 0, "AssignBy": 1}`,
      f: 'Assign Conversation to Agent ( Assign )',
    };
    const response = await CommonAPI(body);
    if (response) {
      return response;
    }
    return null;
  } catch (error) {
    console.error('Error unassigning user:', error);
    return null;
  }
};

export const sendReplyMessage = async ({ phoneNo, message, userId, customerId, contextId, contextType = 2 }) => {
  const body = {
    userId: String(userId),
    customerId: String(customerId),
    phoneNo: String(phoneNo),
    type: 'text',
    ContextType: contextType,
    context: { message_id: String(contextId) },
    text: { body: message, preview_url: false },
  };

  try {
    const headers = getHeaders();
    const response = await fetch(MESSAGEAPIURL(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Reply message API error:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending reply:', error);
    return null;
  }
};

export const sendForwardMessage = async ({ userId, contacts, type = 'text', contextType = 1, contextId, bodyText }) => {
  const body = {
    userId: String(userId),
    Customers: contacts.map((c) => ({
      customerId: c.customerId || c.CustomerId,
      phoneNo: c.phoneNo || c.CustomerPhone,
    })),
    type,
    ContextType: contextType,
    context: { message_id: String(contextId) },
    [type]: {
      preview_url: false,
      body: bodyText,
    },
  };

  try {
    const headers = getHeaders();
    const response = await fetch(MESSAGEAPIURLBULK(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Forward message API error:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error forwarding message:', error);
    return null;
  }
};

export const savePlayerId = async (socketId, userId, id) => {
  const body = {
    con: JSON.stringify({
      id: '',
      mode: 'wa_save_device_tok',
      appuserid: String(userId || ''),
    }),
    p: JSON.stringify({ UserId: Number(id), SocketId: String(socketId) }),
    f: 'Agent Information (Save Device Token)',
  };

  try {
    const response = await CommonAPI(body);
    if (response?.Data) {
      return response.Data;
    }
    return null;
  } catch (error) {
    console.error('Error saving player id:', error);
    return null;
  }
};

export const addCustomer = async (userPhone, userId = 1, firstName = '', lastName = '', conversationId = '') => {
  try {
    const body = {
      con: JSON.stringify({
        id: '',
        mode: 'wa_add_customer',
        appuserid: String(userId || ''),
      }),
      p: JSON.stringify({
        UserPhone: String(userPhone || ''),
        FirstName: String(firstName || ''),
        LastName: String(lastName || ''),
        ConversationId: String(conversationId || ''),
      }),
      f: 'Chat ( Add Customer )',
    };

    const response = await CommonAPI(body);
    if (response?.Data) {
      return response.Data;
    }
    return null;
  } catch (error) {
    console.error('Error adding customer:', error);
    return null;
  }
};
