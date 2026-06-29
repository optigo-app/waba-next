import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { disconnectSocket } from '../../socket';
import {
    Menu,
    MenuItem,
    Divider,
    IconButton,
    ListItemText,
    ListItemIcon,
    Typography,
    Box,
    Avatar,
    CircularProgress
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SyncIcon from '@mui/icons-material/Sync';
import LogoutIcon from '@mui/icons-material/Logout';
import './ProfileAvatar.scss';
import { LoginContext } from '../../context/LoginData';
import { LogoutApi } from '../../API/Logout/Logout';
import { DataSync } from '../../API/DataSync/DataSync';
import { getWhatsAppAvatarConfig } from '../../utils/globalFunc';

const ProfileAvatar = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    const { auth, setAuth, token, setToken, startSync } = useContext(LoginContext);
    const getId = JSON.parse(sessionStorage.getItem("hasSocketId"));

    const username = auth?.username;
    const avatarConfig = getWhatsAppAvatarConfig(username || 'User', 36);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleDataSync = async () => {
        if (!startSync) return;

        setSyncLoading(true);
        try {
            const syncSuccess = await startSync(async () => {
                // This callback will be executed by startSync
                const syncData = await DataSync(auth?.userId);

                // You can add additional success handling here if needed
                if (syncData) {
                    return true;
                }
                throw new Error('No data returned from sync');
            });

            if (!syncSuccess) {
            }
        } catch (error) {
            // This catch block is a fallback in case something unexpected happens
            console.error('Unexpected error during sync:', error);
        } finally {
            setSyncLoading(false);
        }
    };

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            await LogoutApi(auth?.id || getId?.id);

            // Disconnect socket first
            disconnectSocket();

            // Clear auth context
            setAuth({ userId: '', username: '', ukey: '', token: '' });
            setToken({ sv: '', yc: '' });

            // Clear session storage
            sessionStorage.clear();

            navigate('/login');
            handleClose();
        } catch (error) {
            console.error('Error during logout:', error);
            navigate('/login');
            handleClose();
        } finally {
            setLogoutLoading(false);
        }
    };

    return (
        <div className="profile-menu">
            {username && (
                <Typography
                    variant="body1"
                    className="username-text"
                    title={`Welcome ${username}`} // tooltip shows full name
                >
                    Welcome {username}
                </Typography>
            )}
            <IconButton onClick={handleClick} className="profile-avatar" size="large">
                <Avatar
                    alt={username || "User"}
                    sx={avatarConfig.sx}
                >
                    {avatarConfig.children}
                </Avatar>
            </IconButton>


            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    className: 'profile-dropdown'
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                TransitionProps={{
                    timeout: 250,
                    style: {
                        transitionDelay: open ? '0ms' : '50ms'
                    }
                }}
            >
                <Box className="menu-header" sx={{ paddingLeft: "10px", paddingTop: "10px" }}>
                    <Typography className="menu-section-title">My Account</Typography>
                </Box>

                <MenuItem onClick={handleClose} className="menu-item">
                    <ListItemIcon className="menu-icon" sx={{ minWidth: "30px !important" }}>
                        <AccountCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Profile"
                        primaryTypographyProps={{ className: 'menu-text' }}
                    />
                </MenuItem>

                <MenuItem
                    onClick={handleDataSync}
                    className={`menu-item ${syncLoading ? 'loading' : ''}`}
                    disabled={syncLoading || !startSync}
                >
                    <ListItemIcon className="menu-icon" sx={{ minWidth: "30px !important" }}>
                        {syncLoading ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <SyncIcon fontSize="small" />
                        )}
                    </ListItemIcon>
                    <ListItemText
                        primary={syncLoading ? "Syncing..." : "Data Sync"}
                        primaryTypographyProps={{ className: 'menu-text' }}
                    />
                </MenuItem>

                <Divider className="menu-divider" />

                <MenuItem
                    onClick={handleLogout}
                    className={`menu-item logout ${logoutLoading ? 'loading' : ''}`}
                    disabled={logoutLoading}
                >
                    <ListItemIcon className="menu-icon" sx={{ minWidth: "30px !important" }}>
                        {logoutLoading ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <LogoutIcon fontSize="small" />
                        )}
                    </ListItemIcon>
                    <ListItemText
                        primary={logoutLoading ? "Logging out..." : "Log out"}
                        primaryTypographyProps={{ className: 'menu-text' }}
                    />
                </MenuItem>
            </Menu>
        </div>
    );
};

export default ProfileAvatar;
