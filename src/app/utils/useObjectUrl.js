import { useState, useLayoutEffect } from 'react';

/**
 * Create an object URL for a single Blob/File and auto-revoke on unmount or change.
 * Uses useLayoutEffect so the URL is ready before the browser paints.
 */
export function useObjectUrl(blob) {
  const [url, setUrl] = useState('');

  useLayoutEffect(() => {
    if (!blob) {
      setUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
}

/**
 * Create object URLs for an array of Blobs/Files and auto-revoke on unmount or change.
 * Preserves index alignment: result[i] corresponds to input[i].
 */
export function useObjectUrls(blobs) {
  const [urls, setUrls] = useState([]);

  useLayoutEffect(() => {
    const objectUrls = blobs.map((b) => (b ? URL.createObjectURL(b) : ''));
    setUrls(objectUrls);
    return () => objectUrls.filter(Boolean).forEach((u) => URL.revokeObjectURL(u));
  }, [blobs]);

  return urls;
}
