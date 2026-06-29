import { formatChatTimestamp } from '../../utils/DateFnc';
import { getCustomerAvatarSeed, getCustomerDisplayName, getWhatsAppAvatarConfig } from '../../utils/globalFunc';
import React from 'react';
import { Archive, ArchiveRestore, File, FileText, Image, MessageCircle, Pin, PinOff, Star, StarOff, UserPlus, Video } from 'lucide-react';

export const getMessagePreview = (msg) => {
  const type = msg?.MessageType;
  const text = type === 'text' ? (msg?.Message || '')
    : type === 'image' ? 'Photo'
      : type === 'video' ? 'Video'
        : type === 'document' ? 'Document'
          : type === 'file' ? 'File'
            : type === 'template' ? (msg?.Message ? `Template: ${msg.Message}` : 'Template')
              : 'New message';

  const showIcon = type === 'image' || type === 'video' || type === 'document' || type === 'file' || type === 'template';
  const Icon = type === 'image' ? Image
    : type === 'video' ? Video
      : type === 'document' ? FileText
        : type === 'file' ? File
          : type === 'template' ? MessageCircle
            : null;

  if (!text) {
    return { text: '', node: '' };
  }

  const node = showIcon && Icon
    ? React.createElement(
      'span',
      { style: { display: 'inline-flex', alignItems: 'center', gap: 6 } },
      React.createElement(Icon, { size: 14 }),
      React.createElement('span', null, text)
    )
    : text;

  return { text, node };
};

export const processApiResponse = (apiData) => {
  if (!apiData || !Array.isArray(apiData)) return [];

  return apiData.map((conversation) => {
    let lastMessage = conversation.LastMessage;
    if (typeof lastMessage === 'string') {
      try {
        const parsed = JSON.parse(lastMessage);
        if (Array.isArray(parsed) && parsed.length > 0) {
          lastMessage = parsed[0];
        } else if (parsed && typeof parsed === 'object') {
          lastMessage = parsed;
        }
      } catch (e) {
        console.error('Error parsing LastMessage:', e);
      }
    }

    let tags = [];
    if (conversation.TagList) {
      try {
        tags =
          typeof conversation.TagList === 'string'
            ? JSON.parse(conversation.TagList)
            : conversation.TagList;
      } catch (e) {
        console.error('Error parsing TagList:', e);
      }
    }

    const preview = conversation.LastMessage ? getMessagePreview(lastMessage) : { text: '', node: '' };

    return {
      ...conversation,
      ConversationId: conversation.Id,
      lastMessage: preview.node,
      lastMessageText: preview.text,
      lastMessageTime: formatChatTimestamp(lastMessage?.DateTime || conversation.DateTime),
      lastMessageTimestamp: lastMessage?.DateTime || conversation.DateTime,
      lastMessageStatus: lastMessage?.Status,
      lastMessageDirection: lastMessage?.Direction,
      unreadCount: conversation.UnReadMsgCount || 0,
      tags: tags,
      name: getCustomerDisplayName(conversation),
      avatar: null,
      avatarConfig: getWhatsAppAvatarConfig(getCustomerAvatarSeed(conversation)),
    };
  });
};

/**
 * Extract customer phone from socket message data,
 * especially for outbound messages where Sender is the agent ID
 * and the customer phone lives inside MessageBody JSON.
 */
export const extractCustomerPhoneFromSocketData = (data) => {
  if (!data) return null;
  if (data.CustomerPhone) return data.CustomerPhone;

  // For inbound messages, Sender is the customer phone
  if (data.Direction === 0 || data.Direction === '0') {
    return data.Sender || null;
  }

  // For outbound messages, try to parse MessageBody JSON
  if (data.MessageBody && typeof data.MessageBody === 'string') {
    try {
      const body = JSON.parse(data.MessageBody);
      const phone =
        body?.payload?.to ||
        body?.data?.to ||
        body?.response?.data?.contacts?.[0]?.wa_id ||
        body?.response?.data?.contacts?.[0]?.input;
      if (phone) return String(phone);
    } catch (e) {
      // Ignore JSON parse errors
    }
  }

  return null;
};

export const getCustomerListMenuItems = (member) => [
  {
    action: member?.IsPin === 1 ? 'UnPin' : 'Pin',
    icon: member?.IsPin === 1 ? React.createElement(PinOff, { size: 18 }) : React.createElement(Pin, { size: 18 }),
    label: member?.IsPin === 1 ? 'Unpin' : 'Pin',
  },
  {
    action: member?.IsStar === 1 ? 'UnStar' : 'Star',
    icon: member?.IsStar === 1 ? React.createElement(StarOff, { size: 18 }) : React.createElement(Star, { size: 18 }),
    label: member?.IsStar === 1 ? 'Unfavourite' : 'favourite',
  },
  {
    action: member?.IsArchived === 1 ? 'UnArchive' : 'Archive',
    icon: member?.IsArchived === 1
      ? React.createElement(ArchiveRestore, { size: 18 })
      : React.createElement(Archive, { size: 18 }),
    label: member?.IsArchived === 1 ? 'Unarchive' : 'Archive',
  },
  ...(member?.CustomerName === '' ? [
    {
      action: 'AddCustomer',
      icon: React.createElement(UserPlus, { size: 18 }),
      label: 'Add to Customer',
    },
  ] : []),
];