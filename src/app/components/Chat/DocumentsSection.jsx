'use client';

import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Skeleton } from '@mui/material';
import { Download, FileText } from 'lucide-react';
import useLazyLoading from './useLazyLoading';

export default function DocumentsSection({
  documents,
  mediaCache,
  isLoading,
  hasMore,
  onLoadMore,
  onDocumentClick,
  onDownload,
  paginationFlag,
}) {
  const lastDocumentElementRef = useLazyLoading(onLoadMore, hasMore && paginationFlag, isLoading);

  if (isLoading && documents.length === 0) {
    return (
      <Box>
        <p className="cd-section-title">Documents</p>
        <List disablePadding>
          {Array.from({ length: 6 }).map((_, idx) => (
            <ListItem
              key={`doc-skel-${idx}`}
              disableGutters
              secondaryAction={(
                <Skeleton variant="rounded" width={28} height={28} sx={{ borderRadius: 2 }} />
              )}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: 2 }} />
              </ListItemIcon>
              <ListItemText
                primary={<Skeleton variant="text" width="70%" />}
                secondary={<Skeleton variant="text" width="45%" />}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="cd-empty-state">
        <div className="cd-empty-icon">
          <FileText size={44} />
        </div>
        <p className="cd-empty-title">No document found</p>
        <p className="cd-empty-subtitle">Shared documents will appear here</p>
      </div>
    );
  }

  return (
    <Box>
      <p className="cd-section-title">{documents.length} documents</p>
      <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {documents.map((doc, index) => {
          const isLastElement = index === documents.length - 1;
          const name = doc.MediaName || `Document ${doc.Id}`;
          const type = doc.MimeType || 'Document';

          return (
            <Box key={doc.Id || index} ref={isLastElement ? lastDocumentElementRef : null}>
              <ListItem disableGutters disablePadding>
                <ListItemButton
                  onClick={() => onDocumentClick(doc)}
                  sx={{ borderRadius: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                    <FileText size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={name}
                    secondary={type}
                    primaryTypographyProps={{
                      noWrap: true,
                      title: name,
                      sx: { fontWeight: 500 },
                    }}
                    secondaryTypographyProps={{ noWrap: true, title: type }}
                  />
                  <button
                    className="cd-doc-download-btn"
                    title="Download document"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(doc.MediaUrl, doc.MediaName || `document_${doc.Id}`);
                    }}
                  >
                    <Download size={18} />
                  </button>
                </ListItemButton>
              </ListItem>
            </Box>
          );
        })}
      </List>

      {!paginationFlag && hasMore ? (
        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
          <button className="cd-load-more-btn" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </Box>
      ) : null}
    </Box>
  );
}
