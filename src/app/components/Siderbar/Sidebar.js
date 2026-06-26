import { useEffect, useState } from 'react'
import './Sidebar.scss'
import { HomeIcon, MessageCircle, ChevronLeft, LogOut, RefreshCw, User, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { disconnectSocket, broadcastLogout } from '../../socket'
import {Menu, MenuItem, Tooltip, IconButton, Avatar } from '@mui/material'
import { getWhatsAppAvatarConfig } from '@/app/utils/globalFunc'
import { useAuth } from '../../hooks/useAuth'
import { useWallet } from '../../contexts/WalletContext'

const Sidebar = ({isCollapsed = false, onCollapsedChange = () => { } }) => {
    const pathname = usePathname();
    const [activePath, setActivePath] = useState(pathname);
    const { auth, logout, setIsSyncing } = useAuth();
    const router = useRouter();
    const { walletInfo } = useWallet();
    const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
    const isUserMenuOpen = Boolean(userMenuAnchorEl);

    const handleOpenUserMenu = (e) => setUserMenuAnchorEl(e.currentTarget);
    const handleCloseUserMenu = () => setUserMenuAnchorEl(null);

    const handleProfile = () => {
        handleCloseUserMenu();
        router.push('/');
    };

    const handleSync = () => {
        handleCloseUserMenu();
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 3000);
    };

    const handleLogout = () => {
        handleCloseUserMenu();
        disconnectSocket(true);
        broadcastLogout();
        logout();
        window.location.replace(`${window.location.origin}${basePath}/`);
    };

    const ICON_PROPS = { size: 20, strokeWidth: 2 };

    const isLocalhost = typeof window !== 'undefined' && window.location.origin.includes('localhost');
    const basePath = isLocalhost ? '' : (auth?.redirect_version || '');
    const chatPath = `${basePath}/chat`;
    const poweredByImg = `${basePath}/poweredBy.png`;

    const hasWabaData = !!walletInfo && !!walletInfo.wabaId && walletInfo.wabaId !== '-';

    const menuItems = [
        { path: "/", icon: <HomeIcon {...ICON_PROPS} />, label: "Dashboard" },
        ...(hasWabaData ? [
            { path: "/campaign", icon: <LayoutGrid {...ICON_PROPS} />, label: "Campaign" },
            { path: chatPath, icon: <MessageCircle {...ICON_PROPS} />, label: "Chat", external: true },
        ] : []),
    ];

    useEffect(() => {
        setActivePath(pathname);
    }, [pathname]);

    const handleHeaderIconClick = () => {
        if (isCollapsed) {
            onCollapsedChange(false);
        }
        router.push("/");
    };

    return (
        <div
            className={`sidebar_mainDiv ${isCollapsed ? 'collapsed' : ''}`}
            style={{ width: isCollapsed ? 76 : 260, minWidth: isCollapsed ? 76 : 260 }}
        >
            <div className="sidebar-content">
                <div className="sidebar-sections">
                    <div className="agentic-chat-header">
                        <div className="agentic-chat-header__icon" onClick={handleHeaderIconClick}>
                            <div className="icon-bg">
                                <MessageCircle className="icon" {...ICON_PROPS} />
                            </div>
                            {!isCollapsed && <h1 className="title">Agentic chat</h1>}
                        </div>

                        {!isCollapsed && (
                            <Tooltip title="Collapse sidebar" placement="right" arrow>
                                <IconButton
                                    className="sidebar-toggle"
                                    size="small"
                                    onClick={() => onCollapsedChange(!isCollapsed)}
                                >
                                    <ChevronLeft size={18} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                    <div className="sidebar_main">
                        <ul style={{ padding: '2px 0px' }} className='sidebar_main_ul'>
                            {menuItems.map((item) => {
                                const isActive = activePath === item.path ||
                                    (activePath === "/archieve" && item.path === "/");

                                let content = (
                                    <>
                                        {item.icon}
                                        {!isCollapsed && <span>{item.label}</span>}
                                    </>
                                );

                                return (
                                    <li key={item.label} className='sidebar_main_li'>
                                        <Tooltip
                                            title={item.label}
                                            placement="right"
                                            arrow
                                            disableHoverListener={!isCollapsed}
                                            disableFocusListener={!isCollapsed}
                                            disableTouchListener={!isCollapsed}
                                        >
                                            {item.external ? (
                                                <a
                                                    href={item.path}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`sidebar_main_link ${isActive ? "active" : ""}`}
                                                    onClick={() => {
                                                        const perms = sessionStorage.getItem('userPermissions');
                                                        if (perms) localStorage.setItem('userPermissions', perms);
                                                    }}
                                                >
                                                    {content}
                                                </a>
                                            ) : (
                                                <Link
                                                    href={item.path}
                                                    onClick={() => setActivePath(item.path)}
                                                    className={`sidebar_main_link ${isActive ? "active" : ""}`}
                                                >
                                                    {content}
                                                </Link>
                                            )}
                                        </Tooltip>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                {/* User avatar section */}
                <div className={isCollapsed ? "sidebar-user collapsed" : "sidebar-user"}>
                    <Tooltip title={auth?.username || 'User'} placement="right" arrow disableHoverListener={!isCollapsed}>
                        <div
                            className={isCollapsed ? "sidebar-user-trigger_cl sidebar-user-trigger" : "sidebar-user-trigger"}
                            onClick={handleOpenUserMenu}
                            style={{ cursor: 'pointer' }}
                        >
                            <Avatar
                                alt={auth?.username || "User"}
                                {...getWhatsAppAvatarConfig(auth?.username, 40)}
                            />
                             {!isCollapsed && (
                                <span className="sidebar-user-name">{auth?.username || 'User'}</span>
                            )}
                        </div>
                    </Tooltip>
                    <Menu
                        anchorEl={userMenuAnchorEl}
                        open={isUserMenuOpen}
                        onClose={handleCloseUserMenu}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        slotProps={{ paper: { sx: { minWidth: 160 } } }}
                    >
                        <MenuItem onClick={handleProfile}>
                            <User size={16} style={{ marginRight: 10 }} />
                            Profile
                        </MenuItem>
                        <MenuItem onClick={handleSync}>
                            <RefreshCw size={16} style={{ marginRight: 10 }} />
                            Data Sync
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <LogOut size={16} style={{ marginRight: 10 }} />
                            Logout
                        </MenuItem>
                    </Menu>
                </div>

                {/* Powered by section at the bottom */}
                <div className={isCollapsed ? "powered-by collapsed" : "powered-by"}>
                    <span>Powered by </span>
                    <div className="optigo-logo">
                        <img src={poweredByImg} alt="Optigo logo" />
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Sidebar
