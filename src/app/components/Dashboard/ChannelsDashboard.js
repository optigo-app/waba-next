'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    Paper,
    InputBase,
} from '@mui/material';
import { Search, Plus, MessageCircle } from 'lucide-react';
import WalletDrawer from './WalletDrawer';
import ChannelCardSkeleton from './ChannelCardSkeleton';
import OnboardingModal from './OnboardingModal';
import ChannelCard from './ChannelCard';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../contexts/WalletContext';

// ── Static data (replace with API later) ──────────────────────────────────────
const CHANNELS = [
    {
        id: 'whatsapp',
        balance: 1250,
        totalCredits: 5000,
        used: 3750,
    },
];

const ChannelsDashboard = () => {
    const router = useRouter();
    const { auth } = useAuth();
    const { walletInfo, isLoading, loadWalletData } = useWallet();
    const [walletOpen, setWalletOpen] = useState(false);
    const [activeChannel, setActiveChannel] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [onboardingOpen, setOnboardingOpen] = useState(false);

    const appUserId = useMemo(
        () => auth?.userid || auth?.userId || auth?.appuserid || '',
        [auth]
    );

    useEffect(() => {
        loadWalletData(appUserId);
    }, [appUserId, loadWalletData]);

    const channels = useMemo(() => {
        if (!walletInfo) return [];

        return CHANNELS.map((channel) => ({
            ...channel,
            balance: walletInfo.availableBalance,
            totalCredits: walletInfo.totalCredits,
            used: walletInfo.used,
            progressPercent: walletInfo.progressPercent,
            companyCode: walletInfo.companyCode || '-',
            mobileNumber: walletInfo.mobileNumber || '-',
            wabaId: walletInfo.wabaId || '-',
            wabaPhoneNo: walletInfo.wabaPhoneNo || '-',
            refundBalance: walletInfo.refundBalance,
        }));
    }, [walletInfo]);

    const filteredChannels = useMemo(() => {
        if (!searchQuery.trim()) return channels;
        const q = searchQuery.toLowerCase();
        return channels.filter((ch) =>
            ch.companyCode.toLowerCase().includes(q) ||
            ch.mobileNumber.toLowerCase().includes(q) ||
            ch.wabaId.toLowerCase().includes(q)
        );
    }, [channels, searchQuery]);

    const handleWalletOpen = (channel) => {
        setActiveChannel(channel);
        setWalletOpen(true);
    };

    const handleAddChannel = () => {
        setOnboardingOpen(true);
    };

    return (
        <Box sx={{ padding: '2rem', background: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header Section */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    pb: '1.5rem',
                    borderBottom: '1px solid #e4e8ee',
                }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        sx={{
                            fontSize: '1.6rem',
                            fontWeight: 700,
                            color: '#444050',
                            margin: 0,
                            fontFamily: 'Poppins, sans-serif',
                        }}
                    >
                        Channels
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: '0.875rem',
                            color: '#6D6B77',
                            margin: '0.35rem 0 0',
                            fontFamily: 'Poppins, sans-serif',
                        }}
                    >
                        Manage your WhatsApp Business channels and wallets
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Search */}
                    <Paper
                        elevation={0}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '12px',
                            border: '1px solid #e4e8ee',
                            px: '1rem',
                            py: '6px',
                            width: '280px',
                            background: '#fff',
                            transition: 'border-color 0.2s',
                            '&:focus-within': {
                                borderColor: '#1daa61',
                                boxShadow: '0 0 0 3px rgba(29, 170, 97, 0.08)',
                            },
                        }}
                    >
                        <Search size={18} color="#6D6B77" />
                        <InputBase
                            placeholder="Search channels..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{
                                ml: '0.75rem',
                                flex: 1,
                                fontFamily: 'Poppins, sans-serif',
                                fontSize: '0.85rem',
                                color: '#444050',
                                '& input::placeholder': {
                                    color: '#a0a0a0',
                                    opacity: 1,
                                },
                            }}
                        />
                    </Paper>

                    {/* Add Channel Button */}
                    <Button
                        variant="contained"
                        disableElevation
                        onClick={handleAddChannel}
                        startIcon={<Plus size={18} />}
                        sx={{
                            textTransform: 'none',
                            borderRadius: '12px',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            background: '#1daa61',
                            color: '#fff',
                            px: '1.25rem',
                            py: '8px',
                            boxShadow: '0 4px 12px rgba(29, 170, 97, 0.25)',
                            '&:hover': {
                                background: '#1a9a57',
                                boxShadow: '0 6px 16px rgba(29, 170, 97, 0.35)',
                            },
                        }}
                    >
                        Add New Channel
                    </Button>
                </Box>
            </Box>

            {/* Cards Grid */}
            <Box sx={{ marginTop: '2rem' }}>
                {isLoading ? (
                    <ChannelCardSkeleton count={3} />
                ) : filteredChannels.length === 0 ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: '6rem',
                            gap: '1.5rem',
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '24px',
                                background: 'linear-gradient(135deg, rgba(29,170,97,0.08), rgba(37,211,102,0.05))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(29,170,97,0.12)',
                            }}
                        >
                            <MessageCircle size={36} color="#1daa61" />
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography
                                sx={{
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    color: '#444050',
                                }}
                            >
                                {searchQuery ? 'No channels found' : 'No channels yet'}
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: 'Poppins, sans-serif',
                                    fontSize: '0.875rem',
                                    color: '#6D6B77',
                                    mt: '0.25rem',
                                }}
                            >
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Get started by adding your first WhatsApp Business channel'}
                            </Typography>
                        </Box>
                        {!searchQuery && (
                            <Button
                                variant="outlined"
                                onClick={handleAddChannel}
                                startIcon={<Plus size={16} />}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: '12px',
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: 600,
                                    color: '#1daa61',
                                    borderColor: '#1daa61',
                                    '&:hover': {
                                        background: 'rgba(29, 170, 97, 0.06)',
                                        borderColor: '#1daa61',
                                    },
                                }}
                            >
                                Add New Channel
                            </Button>
                        )}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1.5rem',
                            '@media (max-width: 1200px)': {
                                gridTemplateColumns: 'repeat(2, 1fr)',
                            },
                            '@media (max-width: 768px)': {
                                gridTemplateColumns: '1fr',
                            },
                        }}
                    >
                        {filteredChannels.map((channel) => (
                            <ChannelCard
                                key={channel.id}
                                channel={channel}
                                onWalletOpen={() => handleWalletOpen(channel)}
                                onTemplatesClick={() => router.push('/templates')}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            {/* Wallet Drawer */}
            <WalletDrawer
                open={walletOpen}
                onClose={() => setWalletOpen(false)}
                channel={activeChannel}
            />

            {/* Onboarding Modal */}
            <OnboardingModal
                open={onboardingOpen}
                onClose={() => setOnboardingOpen(false)}
            />
        </Box>
    );
};

export default ChannelsDashboard;
