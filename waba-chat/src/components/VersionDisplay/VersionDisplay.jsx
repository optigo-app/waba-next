import React from 'react';
import { Box, Typography } from '@mui/material';
import { APP_VERSION, BUILD_INFO } from '../../config/version';

const VersionDisplay = ({ variant = 'footer' }) => {
    if (variant === 'footer') {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 8,
                    right: 8,
                    padding: '4px 8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: 1,
                    fontSize: '10px',
                    color: 'text.secondary',
                    userSelect: 'none',
                    zIndex: 1000,
                }}
            >
                <Typography variant="caption" sx={{ fontSize: '10px' }}>
                    v{APP_VERSION} d{BUILD_INFO.buildDate}
                </Typography>
            </Box>
        );
    }

    if (variant === 'inline') {
        return (
            <Typography variant="caption" color="text.secondary">
                Version {APP_VERSION} d{BUILD_INFO.buildDate}
            </Typography>
        );
    }

    return null;
};

export default VersionDisplay;
