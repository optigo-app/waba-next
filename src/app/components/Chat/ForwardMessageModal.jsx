'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Avatar, Box, Button, TextField, Typography,
  MenuList, MenuItem, ListItemAvatar, ListItemText, Checkbox, Chip,
} from '@mui/material';
import { Search, User, Send } from 'lucide-react';
import { getCustomerDisplayName, getCustomerAvatarSeed, getWhatsAppAvatarConfig } from './utils/chatUtils';
import { fetchConversationLists } from '../../api/chat/conversationApi';
import { useAuth } from '../../hooks/useAuth';
import CustomerModal from './ui/CustomerModal';
import toast from 'react-hot-toast';

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function ForwardMessageModal({ message, onSend, onClose }) {
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const { auth } = useAuth();

  const loadContacts = useCallback(async () => {
    if (!auth?.userId) return;
    setLoading(true);
    try {
      const response = await fetchConversationLists(1, 500, auth.userId, debouncedSearchTerm);
      const list = response?.data?.rd || response?.data || [];
      setContacts(list);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [auth?.userId, debouncedSearchTerm]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;
    const term = searchTerm.toLowerCase();
    return contacts.filter((c) => {
      const name = getCustomerDisplayName(c)?.toLowerCase() || '';
      const phone = (c.CustomerPhone || c.Sender || '').toLowerCase();
      return name.includes(term) || phone.includes(term);
    });
  }, [contacts, searchTerm]);

  const handleContactSelect = (contact) => {
    setSelectedContacts((prev) => {
      const cid = contact.CustomerId || contact.Id || contact.id;
      const isSelected = prev.find((c) => (c.CustomerId || c.Id || c.id) === cid);
      return isSelected ? prev.filter((c) => (c.CustomerId || c.Id || c.id) !== cid) : [...prev, contact];
    });
  };

  const handleRemoveContact = (contact) => {
    const cid = contact.CustomerId || contact.Id || contact.id;
    setSelectedContacts((prev) => prev.filter((c) => (c.CustomerId || c.Id || c.id) !== cid));
  };

  const allFilteredSelected = useMemo(() => {
    if (filteredContacts.length === 0) return false;
    return filteredContacts.every((contact) => {
      const cid = contact.CustomerId || contact.Id || contact.id;
      return selectedContacts.some((c) => (c.CustomerId || c.Id || c.id) === cid);
    });
  }, [filteredContacts, selectedContacts]);

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered contacts
      const filteredIds = filteredContacts.map((c) => c.CustomerId || c.Id || c.id);
      setSelectedContacts((prev) => prev.filter((c) => {
        const id = c.CustomerId || c.Id || c.id;
        return !filteredIds.includes(id);
      }));
    } else {
      // Select all filtered contacts
      setSelectedContacts((prev) => {
        const next = [...prev];
        filteredContacts.forEach((contact) => {
          const cid = contact.CustomerId || contact.Id || contact.id;
          if (!next.some((c) => (c.CustomerId || c.Id || c.id) === cid)) {
            next.push(contact);
          }
        });
        return next;
      });
    }
  };

  const handleSend = () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }
    onSend?.(selectedContacts);
    onClose?.();
  };

  return (
    <CustomerModal
      open={true}
      onClose={onClose}
      title="Forward to"
      maxWidth="xs"
      contentSx={{ p: 0, pt: 0, fontFamily: 'var(--chat-font)' }}
      actions={
        <>
          <Button
            onClick={onClose}
            variant="outlined"
            color="secondary"
            size="medium"
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              px: 3,
              fontFamily: 'var(--chat-font)',
              fontWeight: 600,
              borderColor: '#d1d5db',
              color: '#374151',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: '#f9fafb',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={selectedContacts.length === 0}
            variant="contained"
            size="medium"
            startIcon={<Send size={15} />}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              px: 3,
              fontFamily: 'var(--chat-font)',
              fontWeight: 600,
              backgroundColor: 'var(--chat-btn-bg, #1daa61)',
              '&:hover': { backgroundColor: 'var(--chat-btn-hover-color, #128c7e)' },
              '&:disabled': { backgroundColor: '#e5e7eb', color: '#9ca3af' },
            }}
          >
            Send
          </Button>
        </>
      }
    >
      {/* Search */}
      <Box sx={{ px: 3, pb: 2, pt: 1, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <Search size={16} style={{ color: '#6b7280', marginRight: 8 }} />
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              fontSize: '0.875rem',
              backgroundColor: '#ffffff',
              fontFamily: 'var(--chat-font)',
              color: '#1f2937',
              '& fieldset': {
                borderColor: '#d1d5db',
                borderWidth: '1.5px',
              },
              '&:hover fieldset': {
                borderColor: '#9ca3af',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--chat-primary, #25d366)',
                borderWidth: '2px',
              },
              '& input::placeholder': {
                color: '#6b7280',
                opacity: 1,
              },
            },
          }}
        />
      </Box>

      {/* Select All Toggle */}
      {filteredContacts.length > 0 && (
        <Box
          sx={{
            px: 3,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            backgroundColor: '#f9fafb',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={handleToggleSelectAll}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'var(--chat-font)',
              fontWeight: 600,
              fontSize: '0.82rem',
              color: '#4b5563',
            }}
          >
            {allFilteredSelected ? 'Deselect all' : 'Select all'} ({filteredContacts.length} contacts)
          </Typography>
          <Checkbox
            size="small"
            checked={allFilteredSelected}
            onChange={handleToggleSelectAll}
            onClick={(e) => e.stopPropagation()}
            sx={{
              color: '#9ca3af',
              '&.Mui-checked': { color: 'var(--chat-primary, #25d366)' },
              p: 0.5,
            }}
          />
        </Box>
      )}

      {/* Selected chips */}
      {selectedContacts.length > 0 && (
        <Box
          sx={{
            px: 3,
            py: 1.5,
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            maxHeight: 100,
            overflowY: 'auto',
          }}
        >
          {selectedContacts.map((contact) => (
            <Chip
              key={contact.CustomerId || contact.Id || contact.id}
              label={getCustomerDisplayName(contact)}
              onDelete={() => handleRemoveContact(contact)}
              size="small"
              sx={{
                height: 26,
                fontSize: '0.78rem',
                fontWeight: 500,
                borderRadius: '8px',
                backgroundColor: 'var(--chat-primary-light, rgba(37, 211, 102, 0.12))',
                color: '#1f2937',
                border: '1px solid rgba(37, 211, 102, 0.2)',
                fontFamily: 'var(--chat-font)',
                '& .MuiChip-deleteIcon': { color: '#6b7280', fontSize: '15px', '&:hover': { color: 'error.main' } },
              }}
            />
          ))}
        </Box>
      )}

      {/* Contact list */}
      <Box sx={{ maxHeight: 280, minHeight: 180, overflowY: 'auto', px: 2, py: 1 }}>
        <MenuList dense sx={{ py: 0 }}>
          {loading && filteredContacts.length === 0 && (
            <MenuItem disabled sx={{ py: 1.5 }}>
              <ListItemText
                primary="Loading contacts..."
                primaryTypographyProps={{ fontSize: '0.875rem', color: 'text.secondary', fontFamily: 'var(--chat-font)' }}
              />
            </MenuItem>
          )}
          {!loading && filteredContacts.length === 0 && (
            <MenuItem disabled sx={{ py: 1.5 }}>
              <ListItemText
                primary="No contacts found"
                primaryTypographyProps={{ fontSize: '0.875rem', color: 'text.secondary', fontFamily: 'var(--chat-font)' }}
              />
            </MenuItem>
          )}
          {filteredContacts.map((contact) => {
            const cid = contact.CustomerId || contact.Id || contact.id;
            const isSelected = selectedContacts.find((c) => (c.CustomerId || c.Id || c.id) === cid);
            const name = getCustomerDisplayName(contact);
            return (
              <MenuItem
                key={cid}
                onClick={() => handleContactSelect(contact)}
                sx={{
                  borderRadius: '10px',
                  py: 1,
                  px: 1.5,
                  my: 0.25,
                  backgroundColor: isSelected ? 'var(--chat-primary-light, rgba(37, 211, 102, 0.12))' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--chat-primary, #25d366)' : '3px solid transparent',
                  '&:hover': { backgroundColor: isSelected ? 'var(--chat-primary-light, rgba(37, 211, 102, 0.16))' : 'action.hover' },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <Avatar
                    sx={{ width: 34, height: 34 }}
                    {...getWhatsAppAvatarConfig(getCustomerAvatarSeed(contact), 34)}
                  >
                    <User size={16} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={name}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary', fontFamily: 'var(--chat-font)' }}
                />
                <Checkbox
                  size="small"
                  checked={!!isSelected}
                  sx={{
                    color: 'action.disabled',
                    '&.Mui-checked': { color: 'var(--chat-primary, #25d366)' },
                    p: 0.5,
                  }}
                />
              </MenuItem>
            );
          })}
        </MenuList>
      </Box>
    </CustomerModal>
  );
}
