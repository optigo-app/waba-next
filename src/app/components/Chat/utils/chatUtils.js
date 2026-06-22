import React from 'react';
import {
  Check, CheckCheck, Clock3, AlertCircle,
  Image, Video, FileText, File, MessageCircle,
} from 'lucide-react';
import { formatChatTimestamp } from './dateUtils';

const hashString = (value) => {
  const str = String(value ?? '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getInitials = (name) => {
  const cleaned = String(name ?? '').trim();
  if (!cleaned) return '?';

  const numeric = cleaned.replace(/\D/g, '');
  if (numeric && numeric.length >= 2) return numeric.slice(-2);

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

export const getSoftAvatarColors = (seed) => {
  const h = hashString(seed) % 360;
  const s = 45 + (hashString(`${seed}-s`) % 11);
  const l = 86 + (hashString(`${seed}-l`) % 8);

  const fgS = Math.min(72, s + 18);
  const fgL = 26 + (hashString(`${seed}-fg`) % 10);

  return {
    bg: `hsl(${h}, ${s}%, ${l}%)`,
    fg: `hsl(${h}, ${fgS}%, ${fgL}%)`,
  };
};

export const hasCustomerName = (customer) => {
  const name = customer?.CustomerName;
  const whatsappName = customer?.WhatsappCustName;
  return Boolean(String(name ?? '').trim()) || Boolean(String(whatsappName ?? '').trim());
};

export const getCustomerDisplayName = (customer) => {
  const name = String(customer?.CustomerName ?? '').trim();
  if (name) return name;

  const whatsappName = String(customer?.WhatsappCustName ?? '').trim();
  if (whatsappName) return whatsappName;

  const phone = String(customer?.CustomerPhone ?? '').trim();
  if (phone) return phone;

  const sender = String(customer?.Sender ?? '').trim();
  if (sender) {
    if (
      customer?.Direction === 0 ||
      customer?.Direction === '0' ||
      (customer?.Direction === undefined && /^\+?\d{5,}$/.test(sender))
    ) {
      return sender;
    }
  }

  const fallback = String(customer?.name ?? '').trim();
  if (fallback) return fallback;

  return 'Unknown';
};

export const getCustomerAvatarSeed = (customer) => {
  const name = String(customer?.CustomerName ?? '').trim();
  if (name) return name;

  const whatsappName = String(customer?.WhatsappCustName ?? '').trim();
  if (whatsappName) return whatsappName;

  const phone = String(customer?.CustomerPhone ?? '').trim();
  if (phone) return phone;

  const sender = String(customer?.Sender ?? '').trim();
  if (sender) {
    if (
      customer?.Direction === 0 ||
      customer?.Direction === '0' ||
      (customer?.Direction === undefined && /^\+?\d{5,}$/.test(sender))
    ) {
      return sender;
    }
  }
  return String(customer?.name ?? '').trim();
};

export const getWhatsAppAvatarConfig = (name, size = 40) => {
  const cleaned = String(name ?? '').trim();
  const { bg, fg } = getSoftAvatarColors(cleaned || 'unknown');

  return {
    sx: {
      bgcolor: bg,
      color: fg,
      width: size,
      height: size,
      fontSize: Math.max(14, Math.round(size * 0.4)),
      fontWeight: 600,
    },
    children: getInitials(cleaned),
  };
};

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
        // ignore parse errors
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
        // ignore parse errors
      }
    }

    const preview = conversation.LastMessage ? getMessagePreview(lastMessage) : { text: '', node: '' };

    return {
      ...conversation,
      Id: conversation.Id ?? conversation.ConversationId ?? conversation.autoid,
      ConversationId: conversation.ConversationId ?? conversation.Id ?? conversation.autoid,
      lastMessage: preview.node,
      lastMessageText: preview.text,
      lastMessageTime: formatChatTimestamp(lastMessage?.DateTime || conversation.DateTime),
      lastMessageTimestamp: lastMessage?.DateTime || conversation.DateTime,
      lastMessageStatus: lastMessage?.Status,
      lastMessageDirection: lastMessage?.Direction,
      unreadCount: conversation.UnReadMsgCount || 0,
      tags,
      name: getCustomerDisplayName(conversation),
      avatar: null,
      avatarConfig: getWhatsAppAvatarConfig(getCustomerAvatarSeed(conversation), 38),
    };
  });
};

export const parseTemplateData = (message) => {
  if (!message || (message.MessageType !== 'template' && message.type !== 'template') || (!message.MessageBody && !message.messageBody)) {
    return { isTemplate: false };
  }
  try {
    const raw = message.MessageBody || message.messageBody;
    const body = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const template = body?.payload?.template;
    if (!template) return { isTemplate: false };

    const params = {};
    const bodyComponent = template.components?.find((c) => c.type === 'body');
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
      components: template.components || [],
    };
  } catch (error) {
    console.error('Error parsing template message:', error);
    return { isTemplate: false };
  }
};

export const getMessageStatusIcon = (member) => {
  if (member?.lastMessageDirection !== 1) return null;

  const status = typeof member?.lastMessageStatus === 'number' ? member.lastMessageStatus : -1;

  switch (status) {
    case 0:
      return React.createElement(Clock3, { size: 14, style: { marginRight: 5, color: '#9e9e9e' } });
    case 1:
      return React.createElement(Check, { size: 15, style: { marginRight: 5, color: '#9e9e9e' } });
    case 2:
      return React.createElement(CheckCheck, { size: 15, style: { marginRight: 5, color: '#9e9e9e' } });
    case 3:
      return React.createElement(CheckCheck, { size: 15, style: { marginRight: 5, color: '#1F51FF' } });
    case 4:
      return React.createElement(AlertCircle, { size: 14, style: { marginRight: 5, color: '#ff4444' } });
    default:
      return null;
  }
};

const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
const TEL_REGEX = /\+?[\d\s\-]{7,20}/g;

export const renderLinks = (text = '', { onLinkClick } = {}) => {
  if (!text) return text;

  const parts = [];
  let lastIndex = 0;

  // Match URLs
  const urlMatches = Array.from(text.matchAll(URL_REGEX));
  const telMatches = Array.from(text.matchAll(TEL_REGEX));
  const allMatches = [...urlMatches, ...telMatches].sort((a, b) => a.index - b.index);

  for (const match of allMatches) {
    const start = match.index;
    const end = start + match[0].length;
    const isUrl = match[0].startsWith('http') || match[0].startsWith('www');

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    const href = isUrl
      ? (match[0].startsWith('www') ? `https://${match[0]}` : match[0])
      : `tel:${match[0].replace(/\s/g, '')}`;

    const handleClick = (e) => {
      if (isUrl && onLinkClick) {
        e.preventDefault();
        onLinkClick(href);
      }
    };

    parts.push(
      React.createElement('a', {
        key: `link-${start}`,
        href,
        target: isUrl ? '_blank' : undefined,
        rel: isUrl ? 'noopener noreferrer' : undefined,
        style: {
          color: '#1daa61',
          textDecoration: 'none',
          fontWeight: 500,
          wordBreak: 'break-all',
          transition: 'opacity 0.2s',
        },
        onMouseOver: (e) => { e.target.style.opacity = '0.8'; e.target.style.textDecoration = 'underline'; },
        onMouseOut: (e) => { e.target.style.opacity = '1'; e.target.style.textDecoration = 'none'; },
        onClick: handleClick,
      }, match[0])
    );

    lastIndex = end;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};
