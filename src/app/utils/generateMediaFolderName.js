const sanitizeSegment = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  return raw
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .join('_')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
};

export const generateMediaFolderName = (conversationId, category = 'docs') => {
  const conv = sanitizeSegment(conversationId || 'unknown');
  const cat = sanitizeSegment(category || 'docs') || 'docs';
  return `wabachat/conv_${conv}/${cat}`;
};
