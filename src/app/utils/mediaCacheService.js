import { fetchChatMediaBlob } from '../api/chat/conversationApi';
import { filesUploadApi } from '../api/filesUploadApi';
import { generateMediaFolderName } from './generateMediaFolderName';

const STORAGE_KEY = 'waba_media_cache_v1';
const MAX_MEMORY_ENTRIES = 300;

// In-memory cache (survives re-renders & conversation switches)
const memoryCache = new Map();
// In-flight fetch deduplication
const inFlight = new Map();

// Hydrate from sessionStorage on module load
try {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([k, v]) => {
      if (!memoryCache.has(k)) memoryCache.set(k, v);
    });
  }
} catch {
  /* ignore corrupt storage */
}

function persist() {
  try {
    const obj = Object.fromEntries(memoryCache.entries());
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* ignore quota errors */
  }
}

function trimCache() {
  if (memoryCache.size <= MAX_MEMORY_ENTRIES) return;
  const toRemove = memoryCache.size - MAX_MEMORY_ENTRIES;
  const iter = memoryCache.keys();
  for (let i = 0; i < toRemove; i++) {
    const key = iter.next().value;
    if (key) memoryCache.delete(key);
  }
}

export const getCachedMediaUrl = (mediaId) => {
  if (!mediaId || typeof mediaId !== 'string') return null;
  return memoryCache.get(mediaId) || null;
};

export const setCachedMediaUrl = (mediaId, url) => {
  if (!mediaId || !url) return;
  memoryCache.set(mediaId, url);
  trimCache();
  persist();
};

/**
 * Batch-set multiple media URLs in one persist operation.
 * Use this when pre-populating from API responses to avoid N sessionStorage writes.
 */
export const setCachedMediaUrls = (entries) => {
  if (!entries || typeof entries !== 'object') return;
  let changed = false;
  Object.entries(entries).forEach(([mediaId, url]) => {
    if (!mediaId || !url) return;
    memoryCache.set(mediaId, url);
    changed = true;
  });
  if (!changed) return;
  trimCache();
  persist();
};

export const preloadCacheIntoState = () => {
  return Object.fromEntries(memoryCache.entries());
};

export const isMediaId = (val) => {
  if (!val || typeof val !== 'string') return false;
  // Skip if already a direct URL, blob, or data URI
  if (/^(https?:|blob:|data:)/i.test(val)) return false;
  return true;
};

// Detect if a URL is already hosted on our own server (skip re-upload)
// Checks path segment 'wabachat/' to avoid false positives in other URL parts
const isOurServerUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.pathname.includes('/wabachat/');
  } catch {
    return false;
  }
};

export const fetchAndCacheMedia = async (mediaId, conversationId) => {
  if (!mediaId || typeof mediaId !== 'string') return null;
  if (!isMediaId(mediaId)) return mediaId; // already a URL

  // Return from cache immediately if available
  const cached = getCachedMediaUrl(mediaId);
  if (cached) return cached;

  // Deduplicate concurrent fetches for the same mediaId
  if (inFlight.has(mediaId)) return inFlight.get(mediaId);

  const promise = (async () => {
    try {
      const result = await fetchChatMediaBlob(mediaId);
      let blobToUpload = null;
      let originalUrl = null;

      // ------------------------------------------------------------------
      // 1) Backend returned a direct URL — fetch the binary content so we
      //    can upload it to our own server (unless it's already our URL).
      // ------------------------------------------------------------------
      if (result?.url) {
        if (isOurServerUrl(result.url)) {
          setCachedMediaUrl(mediaId, result.url);
          return result.url;
        }
        originalUrl = result.url;
        try {
          const resp = await fetch(result.url);
          if (resp.ok) {
            blobToUpload = await resp.blob();
          }
        } catch (fetchErr) {
          console.warn('[mediaCacheService] Could not fetch URL content for upload, will fallback to original URL', fetchErr);
        }
      }

      // ------------------------------------------------------------------
      // 2) Backend returned a raw blob — use it directly.
      // ------------------------------------------------------------------
      if (result?.blob && !blobToUpload) {
        blobToUpload = result.blob;
      }

      // ------------------------------------------------------------------
      // 3) Upload the binary to our own server.
      // ------------------------------------------------------------------
      if (blobToUpload) {
        try {
          const ext = (blobToUpload.type?.split('/')[1] || 'bin');
          const safeExt = ext.replace(/[^a-z0-9]/gi, '');
          const fileName = `media_${mediaId}.${safeExt}`;
          const file = new File([blobToUpload], fileName, { type: blobToUpload.type || 'application/octet-stream' });
          const folderName = generateMediaFolderName(conversationId, 'chat_media');

          const uploadResult = await filesUploadApi({
            attachments: [{ file }],
            folderName,
            uniqueNo: mediaId,
          });

          const serverUrl = uploadResult?.files?.[0]?.url;
          if (serverUrl) {
            setCachedMediaUrl(mediaId, serverUrl);
            return serverUrl;
          }
        } catch (uploadErr) {
          console.warn('[mediaCacheService] Upload to own server failed for', mediaId, uploadErr);
        }
      }

      // ------------------------------------------------------------------
      // 4) Fallback: if we couldn't upload, return the original URL.
      // ------------------------------------------------------------------
      if (originalUrl) {
        setCachedMediaUrl(mediaId, originalUrl);
        return originalUrl;
      }

      return null;
    } catch (err) {
      console.error('[mediaCacheService] Failed to fetch media', mediaId, err);
      return null;
    } finally {
      inFlight.delete(mediaId);
    }
  })();

  inFlight.set(mediaId, promise);
  return promise;
};

/**
 * Extract media IDs from a message object.
 * Returns an array of mediaId strings that need fetching.
 * Skips IDs when the message already has a direct FileUrl from our server.
 */
export const extractMediaIds = (msg) => {
  if (!msg) return [];
  // If the message already has a server FileUrl, nothing needs fetching
  const directUrl = msg?.FileUrl;
  if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) return [];
  const candidates = [
    msg?.MediaUrl,
    msg?.mediaUrl,
    msg?.mediaId,
    msg?.imageUrl,
    msg?.documentUrl,
    msg?.videoUrl,
    msg?.audioUrl,
  ];
  const ids = [];
  candidates.forEach((val) => {
    if (isMediaId(val)) ids.push(val);
  });
  return ids;
};

/**
 * Revoke any blob URLs that are no longer cached.
 * Call this when clearing conversation state to avoid leaking object URLs.
 */
export const revokeStaleBlobUrls = (retainedMediaIds = []) => {
  const retained = new Set(retainedMediaIds);
  for (const [id, url] of memoryCache.entries()) {
    if (url?.startsWith('blob:') && !retained.has(id)) {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      memoryCache.delete(id);
    }
  }
  persist();
};
