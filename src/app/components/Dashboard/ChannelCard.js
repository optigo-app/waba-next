'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { FileText, Wallet } from 'lucide-react';
import { Whatsapp } from '../../assests/svg';

const ChannelCard = ({ channel, onWalletOpen, onTemplatesClick }) => {
    const progressPercent = channel.progressPercent || 0;

    return (
        <Paper
            sx={{
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #e4e8ee',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                overflow: 'hidden',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
                    transform: 'translateY(-4px)',
                    borderColor: 'rgba(29, 170, 97, 0.25)',
                },
            }}
        >
            {/* Top Row: Icon + Info | Balance */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Box
                        sx={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, rgba(29,170,97,0.12), rgba(37,211,102,0.08))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: '1px solid rgba(29,170,97,0.15)',
                        }}
                    >
                        <Whatsapp width={28} height={28} fill="#1daa61" />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <Typography
                            sx={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#444050',
                                lineHeight: 1.2,
                                fontFamily: 'Poppins, sans-serif',
                            }}
                        >
                            {channel.companyCode}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.75rem',
                                color: '#6D6B77',
                                fontWeight: 500,
                                fontFamily: 'Poppins, sans-serif',
                            }}
                        >
                            Mobile: {channel.mobileNumber}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.75rem',
                                color: '#6D6B77',
                                fontWeight: 500,
                                fontFamily: 'Poppins, sans-serif',
                            }}
                        >
                            WABA ID: {channel.wabaId}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                    <Typography
                        sx={{
                            fontSize: '0.68rem',
                            color: '#6D6B77',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontFamily: 'Poppins, sans-serif',
                        }}
                    >
                        Available
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '1.4rem',
                            fontWeight: 600,
                            color: '#1daa61',
                            letterSpacing: '-0.02em',
                            fontFamily: 'Poppins, sans-serif',
                        }}
                    >
                        ₹{channel.balance.toLocaleString('en-IN')}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '0.72rem',
                            color: '#0ea5a4',
                            fontWeight: 600,
                            fontFamily: 'Poppins, sans-serif',
                        }}
                    >
                        Refund: ₹{channel.refundBalance.toLocaleString('en-IN')}
                    </Typography>
                </Box>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '2px' }}>
                    <Typography
                        sx={{
                            fontSize: '0.72rem',
                            color: '#6D6B77',
                            fontWeight: 500,
                            fontFamily: 'Poppins, sans-serif',
                        }}
                    >
                        Usage
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '0.72rem',
                            color: '#6D6B77',
                            fontWeight: 600,
                            fontFamily: 'Poppins, sans-serif',
                        }}
                    >
                        {Math.round(progressPercent)}%
                    </Typography>
                </Box>
                <Box
                    sx={{
                        width: '100%',
                        height: '8px',
                        borderRadius: '99px',
                        backgroundColor: '#edf2f7',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            width: `${Math.min(progressPercent, 100)}%`,
                            height: '100%',
                            borderRadius: '99px',
                            background: 'linear-gradient(90deg, #1daa61, #25d366)',
                            transition: 'width 0.5s ease',
                        }}
                    />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography
                        sx={{
                            fontSize: '0.72rem',
                            color: '#6D6B77',
                            fontWeight: 500,
                            fontFamily: 'Poppins, sans-serif',
                        }}
                    >
                        Used: ₹{channel.used.toLocaleString('en-IN')}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '0.72rem',
                            color: '#6D6B77',
                            fontWeight: 500,
                            fontFamily: 'Poppins, sans-serif',
                        }}
                    >
                        Total: ₹{channel.totalCredits.toLocaleString('en-IN')}
                    </Typography>
                </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: '0.75rem', width: '100%', pt: '0.25rem' }}>
                <Button
                    variant="contained"
                    disableElevation
                    onClick={onTemplatesClick}
                    startIcon={<FileText size={16} />}
                    fullWidth
                    sx={{
                        textTransform: 'none',
                        borderRadius: '12px',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        background: '#1daa61',
                        color: '#fff',
                        py: '8px',
                        boxShadow: 'none',
                        '&:hover': {
                            background: '#1a9a57',
                            boxShadow: 'none',
                        },
                    }}
                >
                    Templates
                </Button>
                <Button
                    variant="outlined"
                    onClick={onWalletOpen}
                    startIcon={<Wallet size={16} />}
                    fullWidth
                    sx={{
                        textTransform: 'none',
                        borderRadius: '12px',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: '#444050',
                        borderColor: '#e4e8ee',
                        py: '8px',
                        '&:hover': {
                            borderColor: '#1daa61',
                            color: '#1daa61',
                            background: 'rgba(29, 170, 97, 0.04)',
                        },
                    }}
                >
                    Wallet Log
                </Button>
            </Box>
        </Paper>
    );
};

export default ChannelCard;
