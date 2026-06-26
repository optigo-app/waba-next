'use client';

import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Skeleton } from '@mui/material';
import { Link, Share2 } from 'lucide-react';
import useLazyLoading from './useLazyLoading';

export default function LinksSection({
  links,
  isLoading,
  hasMore,
  onLoadMore,
  onShare,
  paginationFlag,
}) {
  const lastLinkElementRef = useLazyLoading(onLoadMore, hasMore && paginationFlag, isLoading);

  if (isLoading && links.length === 0) {
    return (
      <Box>
        <p className="cd-section-title">Links</p>
        <List disablePadding>
          {Array.from({ length: 6 }).map((_, idx) => (
            <ListItem
              key={`link-skel-${idx}`}
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
                secondary={<Skeleton variant="text" width="55%" />}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }

  if (links.length === 0) {
    return (
      <div className="cd-empty-state">
        <div className="cd-empty-icon">
          <Link size={44} />
        </div>
        <p className="cd-empty-title">No links found</p>
        <p className="cd-empty-subtitle">Shared links and URLs will appear here</p>
      </div>
    );
  }

  return (
    <Box>
      <p className="cd-section-title">{links.length} links</p>
      <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {links.map((link, index) => {
          const isLastElement = index === links.length - 1;
          const title = link.MediaName || `Link ${link.Id}`;
          const url = link.MediaUrl || '';

          return (
            <Box key={link.Id || index} ref={isLastElement ? lastLinkElementRef : null}>
              <ListItem disableGutters disablePadding>
                <ListItemButton
                  onClick={() => {
                    if (url) window.open(url, '_blank');
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                    <Link size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={title}
                    secondary={url}
                    primaryTypographyProps={{
                      noWrap: true,
                      title,
                      sx: { fontWeight: 500 },
                    }}
                    secondaryTypographyProps={{ noWrap: true, title: url }}
                  />
                  <button
                    className="cd-link-share-btn"
                    title="Share link"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(url);
                    }}
                  >
                    <Share2 size={18} />
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
