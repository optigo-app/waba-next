import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Reply, Forward, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const MessageContextMenu = ({
  open,
  onClose,
  onReply,
  onForward,
  onCopy,
  message,
  mouseX,
  mouseY,
}) => {
  const handleReply = () => {
    onReply?.(message);
    onClose?.();
  };

  const handleForward = (e) => {
    e?.stopPropagation?.();
    onForward?.(message, e);
    onClose?.();
  };

  const handleCopy = () => {
    const textToCopy =
      message?.Message ?? message?.text ?? message?.caption ?? message?.Body ?? '';

    if (!textToCopy) {
      toast.error('Nothing to copy');
      onClose?.();
      return;
    }

    const text = String(textToCopy);

    Promise.resolve(onCopy?.(message))
      .catch(() => {})
      .finally(() => {
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard
            .writeText(text)
            .then(() => toast.success('Text Copied !!'))
            .catch(() => toast.error('Copy failed'))
            .finally(() => onClose?.());
          return;
        }

        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'fixed';
          textarea.style.top = '-1000px';
          document.body.appendChild(textarea);
          textarea.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(textarea);
          if (ok) toast.success('Text Copied !!');
          else toast.error('Copy failed');
        } catch (err) {
          toast.error('Copy failed');
        } finally {
          onClose?.();
        }
      });
  };

  return (
    <Menu
      open={Boolean(open)}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        mouseY != null && mouseX != null ? { top: mouseY, left: mouseX } : undefined
      }
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      onClick={(e) => e.stopPropagation()}
      PaperProps={{
        elevation: 0,
        sx: {
          minWidth: 190,
          borderRadius: 2,
          py: 0.5,
          boxShadow: '0 18px 50px rgba(17, 24, 39, 0.18)',
          border: '1px solid rgba(0,0,0,0.08)',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <MenuItem onClick={handleReply}>
        <ListItemIcon sx={{ minWidth: 34 }}>
          <Reply size={18} />
        </ListItemIcon>
        <ListItemText primary="Reply" />
      </MenuItem>

      <MenuItem onClick={handleForward}>
        <ListItemIcon sx={{ minWidth: 34 }}>
          <Forward size={18} />
        </ListItemIcon>
        <ListItemText primary="Forward" />
      </MenuItem>

      <MenuItem onClick={handleCopy}>
        <ListItemIcon sx={{ minWidth: 34 }}>
          <Copy size={18} />
        </ListItemIcon>
        <ListItemText primary="Copy" />
      </MenuItem>
    </Menu>
  );
};

export default MessageContextMenu;
