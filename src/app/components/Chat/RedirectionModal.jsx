'use client';

import { ExternalLink, X } from 'lucide-react';

export default function RedirectionModal({ isOpen, onClose, onConfirm, url }) {
  if (!isOpen) return null;

  const displayUrl = url?.length > 60 ? `${url.slice(0, 60)}...` : url;

  return (
    <div className="redirection-modal-overlay" onClick={onClose}>
      <div className="redirection-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="redirection-modal-icon">
          <ExternalLink size={28} />
        </div>

        <h3 className="redirection-modal-title">Open this link?</h3>
        <p className="redirection-modal-url">{displayUrl}</p>
        <p className="redirection-modal-desc">
          You are about to leave this app and visit an external website.
        </p>

        <div className="redirection-modal-actions">
          <button className="redirection-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="redirection-btn-confirm" onClick={onConfirm}>
            Continue <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
