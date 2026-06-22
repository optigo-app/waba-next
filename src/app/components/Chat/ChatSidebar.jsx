'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Avatar, Badge, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import {
  Search, Pin, PinOff, Star, StarOff, Archive, ArchiveRestore,
  ChevronDown, UserPlus, X, User as PersonIcon,
} from 'lucide-react';
import {
  getWhatsAppAvatarConfig, getCustomerDisplayName, getCustomerAvatarSeed,
  hasCustomerName, processApiResponse, getMessageStatusIcon,
} from './utils/chatUtils';
import {
  fetchConversationLists,
  pinConversationApi,
  unPinConversationApi,
  favoriteApi,
  unFavoriteApi,
  archieveApi,
  unArchieveApi,
} from '../../api/chat/conversationApi';
import AddCustomerDialog from './AddCustomerDialog';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const TAB_ITEMS = [
  { label: 'All', value: 0 },
  { label: 'Escalated', value: 1 },
  { label: 'favourite', value: 2 },
];

const getMenuItems = (member) => [
  {
    action: member?.IsPin === 1 ? 'UnPin' : 'Pin',
    icon: member?.IsPin === 1 ? <PinOff size={18} /> : <Pin size={18} />,
    label: member?.IsPin === 1 ? 'Unpin' : 'Pin',
  },
  {
    action: member?.IsStar === 1 ? 'UnStar' : 'Star',
    icon: member?.IsStar === 1 ? <StarOff size={18} /> : <Star size={18} />,
    label: member?.IsStar === 1 ? 'Unfavourite' : 'favourite',
  },
  {
    action: member?.IsArchived === 1 ? 'UnArchive' : 'Archive',
    icon: member?.IsArchived === 1 ? <ArchiveRestore size={18} /> : <Archive size={18} />,
    label: member?.IsArchived === 1 ? 'Unarchive' : 'Archive',
  },
  ...(member?.CustomerName === '' ? [
    {
      action: 'AddCustomer',
      icon: <UserPlus size={18} />,
      label: 'Add to Customer',
    },
  ] : []),
];

export default function ChatSidebar({
  onCustomerSelect,
  selectedCustomer,
  isConversationRead,
  viewConversationRead,
  onConversationList,
}) {
  const auth = useAuthStore((s) => s.auth);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);
  const [contextMember, setContextMember] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuMember, setMenuMember] = useState(null);
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const [addCustomerMember, setAddCustomerMember] = useState(null);
  const listRef = useRef(null);

  const loadConversations = useCallback(async () => {
    if (!auth?.userId) return;
    setLoading(true);
    try {
      const response = await fetchConversationLists(1, 100, auth?.userId, searchTerm);
      const rawList = response?.data?.rd || [];
      const list = processApiResponse(rawList);
      setConversations(list);
      onConversationList?.(list);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [auth?.userId, onConversationList, searchTerm]);

  // Initial load on mount / auth ready
  useEffect(() => {
    if (auth?.token && auth?.userId) {
      loadConversations();
    }
  }, [auth?.token, auth?.userId, loadConversations]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return conversations.filter((c) => {
      const haystack = String(getCustomerDisplayName(c) || '').toLowerCase();
      const matchesSearch = haystack.includes(term);
      if (!matchesSearch) return false;

      const isFavorite = c.IsStar === 1;
      switch (tabValue) {
        case 1: return c.ticketStatus === 'escalated';
        case 2: return isFavorite;
        default: return true;
      }
    });
  }, [conversations, searchTerm, tabValue]);

  const handleContextMenu = (e, member) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ mouseX: e.clientX + 2, mouseY: e.clientY + 2 });
    setContextMember(member);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setContextMember(null);
  };

  const handleOpenMenu = (e, member) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setMenuMember(member);
    onConversationList?.(member);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuMember(null);
  };

  const handleOpenAddCustomer = (member) => {
    setAddCustomerMember(member);
    setAddCustomerDialogOpen(true);
  };

  const handleCloseAddCustomer = () => {
    setAddCustomerDialogOpen(false);
    setAddCustomerMember(null);
  };

  const handleAddCustomerSuccess = async () => {
    // Refresh conversation list after adding customer
    if (!auth?.userId) return;
    try {
      const res = await fetchConversationLists(1, 100, auth.userId, searchTerm);
      if (res?.data?.rd) {
        const processed = processApiResponse(res.data.rd);
        setConversations(processed);
        onConversationList?.(processed);
      }
    } catch (err) {
      console.error('Failed to refresh conversations:', err);
    }
  };

  const handleMenuAction = async (action) => {
    handleCloseMenu();
    handleCloseContextMenu();

    const member = menuMember || contextMember;
    if (!member?.ConversationId || !auth?.userId) return;

    const convId = member.ConversationId;
    const userId = auth.userId;
    const email = auth?.email || auth?.userId || '';

    try {
      let response;
      switch (action) {
        case 'Pin':
          response = await pinConversationApi(convId, userId, email);
          break;
        case 'UnPin':
          response = await unPinConversationApi(convId, userId, email);
          break;
        case 'Star':
          response = await favoriteApi(convId, userId, email);
          break;
        case 'UnStar':
          response = await unFavoriteApi(convId, userId, email);
          break;
        case 'Archive':
          response = await archieveApi(convId, userId, email);
          break;
        case 'UnArchive':
          response = await unArchieveApi(convId, userId, email);
          break;
        case 'AddCustomer':
          handleOpenAddCustomer(member);
          return;
        default:
          return;
      }

      if (response) {
        toast.success(`${action} successful`);
        // Refresh conversation list to reflect change
        const res = await fetchConversationLists(userId);
        if (res?.rd) {
          const processed = processApiResponse(res);
          setConversations(processed);
        }
      } else {
        toast.error(`${action} failed`);
      }
    } catch (err) {
      console.error('Menu action error:', err);
      toast.error(`${action} failed`);
    }
  };

  return (
    <div className="chat-sidebar">
      {/* Header */}
      <div className="chat-sidebar-header">
        <h3 className="chat-sidebar-title">Chat Members</h3>
      </div>

      {/* Search */}
      <div className="chat-sidebar-search">
        <Search size={16} className="chat-search-icon" />
        <input
          type="text"
          placeholder="Search conversations"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="chat-search-input"
        />
        {searchTerm && (
          <IconButton size="small" onClick={() => setSearchTerm('')} className="chat-search-clear">
            <X size={14} />
          </IconButton>
        )}
      </div>

      {/* Tabs */}
      <div className="chat-sidebar-filters">
        <div className="chat-tab-buttons">
          {TAB_ITEMS.map((item) => {
            const isActive = tabValue === item.value;
            return (
              <button
                key={item.value}
                type="button"
                className={`chat-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setTabValue(item.value)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="chat-sidebar-list" ref={listRef}>
        {loading && (
          <div className="chat-loading">Loading conversations...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="chat-empty">No conversations found</div>
        )}

        <ul>
          {filtered.map((member) => {
            const isSelected = selectedCustomer?.Id === member.Id;
            const isMenuOpen = Boolean(anchorEl) && menuMember?.Id === member.Id;
            const shouldShowUnread = member.unreadCount > 0;
            const name = member.name || getCustomerDisplayName(member);

            return (
              <li
                key={member.Id}
                className={`${isSelected ? 'active' : ''} ${member?.isReading ? 'reading' : ''} ${isMenuOpen ? 'menu-open' : ''}`}
                onContextMenu={(e) => handleContextMenu(e, member)}
              >
                <div
                  className={`member-item ${isSelected ? 'active' : ''} ${member?.isReading ? 'reading' : ''} ${isMenuOpen ? 'menu-open' : ''}`}
                  onClick={() => onCustomerSelect?.(member)}
                >
                  <div className="member-avatar">
                    {!hasCustomerName(member) ? (
                      <Avatar {...getWhatsAppAvatarConfig(getCustomerAvatarSeed(member), 38)}>
                        <PersonIcon size={16} />
                      </Avatar>
                    ) : (
                      <Avatar {...member.avatarConfig} />
                    )}
                  </div>

                  <div className="member-info">
                    <div className="member-header">
                      <span className={shouldShowUnread ? 'member-name-unread' : 'member-name'}>
                        {name}
                      </span>
                      {member?.lastMessageText && member?.lastMessageText !== 'No message' && (
                        <span className="member-time">{member.lastMessageTime}</span>
                      )}
                    </div>
                    <div className="member-message">
                      <span className={shouldShowUnread ? 'last-message-unread' : 'last-message'}>
                        <span className="last-message-content">
                          <span className="last-message-icon">
                            {getMessageStatusIcon(member)}
                          </span>
                          <span className="last-message-text">
                            {member.lastMessageText !== 'No message' ? (
                              member.lastMessage
                            ) : (
                              <span className="last-message-attachment">{member.lastMessage}</span>
                            )}
                          </span>
                        </span>
                      </span>
                      <span className="member-trailing">
                        {shouldShowUnread && (
                          <Badge
                            badgeContent={member.unreadCount}
                            color="primary"
                            className="unread-badge"
                          />
                        )}

                        <div className="member-actions-bar">
                          {member?.IsPin === 1 && (
                            <Tooltip title={member?.IsPin === 1 ? 'Unpin' : 'Pin'} arrow>
                              <IconButton
                                size="small"
                                className={`action-btn ${member?.IsPin === 1 ? 'is-on' : ''}`}
                                onClick={(e) => { e.stopPropagation(); }}
                              >
                                <Pin size={17} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {member?.IsStar === 1 && (
                            <Tooltip title={member?.IsStar === 1 ? 'Unfavourite' : 'favourite'} arrow>
                              <IconButton
                                size="small"
                                className={`action-btn ${member?.IsStar === 1 ? 'is-on' : ''}`}
                                onClick={(e) => { e.stopPropagation(); }}
                              >
                                <Star size={17} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {member?.CustomerName === '' && (
                            <Tooltip title="Add to Customer" arrow>
                              <IconButton
                                size="small"
                                className="action-btn add-customer-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAddCustomer(member);
                                }}
                              >
                                <UserPlus size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="More" arrow>
                            <IconButton
                              className="action-btn more-btn"
                              size="small"
                              onClick={(e) => handleOpenMenu(e, member)}
                            >
                              <ChevronDown size={17} />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          elevation: 0,
          sx: {
            minWidth: 180,
            borderRadius: 2,
            py: 0.5,
            boxShadow: '0px 6px 18px rgba(0,0,0,0.12), 0px 3px 6px rgba(0,0,0,0.08)',
          },
        }}
      >
        {getMenuItems(menuMember).map((item, index) => (
          <MenuItem
            key={item.action || index}
            onClick={() => handleMenuAction(item.action)}
            sx={{
              py: 1.1,
              px: 2,
              borderRadius: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'translateX(3px)',
              },
            }}
          >
            {item.icon && (
              <span style={{ minWidth: 30, display: 'inline-flex', alignItems: 'center' }}>{item.icon}</span>
            )}
            <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
          </MenuItem>
        ))}
      </Menu>

      {/* Context Menu */}
      <Menu
        open={Boolean(contextMenu)}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          elevation: 0,
          sx: {
            minWidth: 180,
            borderRadius: 2,
            py: 0.5,
            boxShadow: '0px 6px 18px rgba(0,0,0,0.12), 0px 3px 6px rgba(0,0,0,0.08)',
          },
        }}
      >
        {getMenuItems(contextMember).map((item, index) => (
          <MenuItem
            key={item.action || index}
            onClick={() => handleMenuAction(item.action)}
            sx={{
              py: 1.1,
              px: 2,
              borderRadius: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'translateX(3px)',
              },
            }}
          >
            {item.icon && (
              <span style={{ minWidth: 30, display: 'inline-flex', alignItems: 'center' }}>{item.icon}</span>
            )}
            <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
          </MenuItem>
        ))}
      </Menu>

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={addCustomerDialogOpen}
        onClose={handleCloseAddCustomer}
        selectedMember={addCustomerMember}
        onSuccess={handleAddCustomerSuccess}
      />
    </div>
  );
}
