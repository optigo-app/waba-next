'use client';

import { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Avatar,
  Tabs,
  Tab,
  IconButton,
  Chip,
} from '@mui/material';
import { X } from 'lucide-react';
import { getWhatsAppAvatarConfig, getCustomerDisplayName, getCustomerAvatarSeed } from './utils/chatUtils';

function TabPanel({ children, value, index }) {
  return value === index ? (
    <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>{children}</Box>
  ) : null;
}

export default function CustomerDetails({ customer, open, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  if (!customer) return null;

  const baseAvatarConfig = customer?.avatarConfig
    || getWhatsAppAvatarConfig(getCustomerAvatarSeed(customer), 64);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, bgcolor: '#f8f9fa' } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          bgcolor: '#fff',
        }}
      >
        <Typography fontWeight={600} fontSize="1rem">
          Contact Info
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </Box>

      {/* Profile */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 3,
          bgcolor: '#fff',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Avatar {...baseAvatarConfig} sx={{ ...baseAvatarConfig.sx, width: 80, height: 80, fontSize: 28 }} />
        <Typography fontWeight={600} fontSize="1.1rem" sx={{ mt: 1.5 }}>
          {getCustomerDisplayName(customer)}
        </Typography>
        <Typography fontSize="0.8rem" color="text.secondary">
          {customer?.CustomerPhone || customer?.Sender || '—'}
        </Typography>
        {customer?.tags?.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, justifyContent: 'center' }}>
            {customer.tags.map((tag) => (
              <Chip key={tag.id} label={tag.label || tag.TagName} size="small" sx={{ fontSize: '0.7rem' }} />
            ))}
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="fullWidth"
        sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0' }}
      >
        <Tab label="Media" sx={{ textTransform: 'none', fontSize: '0.82rem', fontWeight: 500 }} />
        <Tab label="Docs" sx={{ textTransform: 'none', fontSize: '0.82rem', fontWeight: 500 }} />
        <Tab label="Links" sx={{ textTransform: 'none', fontSize: '0.82rem', fontWeight: 500 }} />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <Typography fontSize="0.85rem" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          Media files will appear here
        </Typography>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography fontSize="0.85rem" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          Documents will appear here
        </Typography>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Typography fontSize="0.85rem" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          Links will appear here
        </Typography>
      </TabPanel>
    </Drawer>
  );
}
