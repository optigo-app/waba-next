'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    Alert,
    InputAdornment,
    IconButton,
} from '@mui/material';
import {
    KeyRound,
    Smartphone,
    Building2,
    Save,
    ChevronRight,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';

const ManualSetupStep = ({ onSave, onBack }) => {
    const [form, setForm] = useState({
        token: '',
        wabaId: '',
        phoneId: '',
    });
    const [showToken, setShowToken] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (field) => (e) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
        setSaved(false);
        setError('');
    };

    const handleSave = async () => {
        setError('');
        setIsSaving(true);

        if (!form.token || !form.wabaId || !form.phoneId) {
            setError('All fields are required.');
            setIsSaving(false);
            return;
        }

        try {
            // Persist to localStorage for immediate use
            const existing = JSON.parse(localStorage.getItem('waba_onboarding_accounts') || '[]');
            const newAccount = {
                id: `manual_${Date.now()}`,
                name: `Account ${form.phoneId.slice(-4)}`,
                phoneId: form.phoneId,
                wabaId: form.wabaId,
                token: form.token,
                source: 'manual',
                createdAt: new Date().toISOString(),
            };
            localStorage.setItem('waba_onboarding_accounts', JSON.stringify([...existing, newAccount]));
            localStorage.setItem('waba_current_account_id', newAccount.id);

            if (onSave) {
                onSave(newAccount);
            }
            setSaved(true);
        } catch (err) {
            setError('Failed to save credentials. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = () => {
        setForm({ token: '', wabaId: '', phoneId: '' });
        setSaved(false);
        setError('');
    };

    const isFilled = form.token && form.wabaId && form.phoneId;

    return (
        <Box sx={{ py: 2 }}>
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(29,170,97,0.06), rgba(37,211,102,0.04))',
                    border: '1px solid rgba(29,170,97,0.15)',
                    mb: 3,
                }}
            >
                <Typography
                    sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: '#444050',
                        mb: 1.5,
                    }}
                >
                    Manual Credentials Setup
                </Typography>
                <Typography
                    sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.82rem',
                        color: '#6D6B77',
                        lineHeight: 1.7,
                    }}
                >
                    If you already have your WhatsApp Business API credentials from Meta,
                    enter them below to connect your account.
                </Typography>
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                    fullWidth
                    label="Access Token"
                    placeholder="EAAxxxxx..."
                    type={showToken ? 'text' : 'password'}
                    value={form.token}
                    onChange={handleChange('token')}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <KeyRound size={18} color="#6D6B77" />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowToken(!showToken)}
                                    edge="end"
                                    size="small"
                                >
                                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiInputBase-root': {
                            borderRadius: '12px',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '0.85rem',
                            background: '#fff',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e4e8ee',
                        },
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1daa61',
                            boxShadow: '0 0 0 3px rgba(29,170,97,0.08)',
                        },
                        '& .MuiInputLabel-root': {
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '0.8rem',
                            color: '#6D6B77',
                        },
                    }}
                />
                <Typography
                    sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.75rem',
                        color: '#a0a0a0',
                        mt: -1,
                        ml: 0.5,
                    }}
                >
                    Meta Developer Console &rarr; Your App &rarr; Access Token
                </Typography>

                <TextField
                    fullWidth
                    label="WABA ID"
                    placeholder="e.g. 123456789012345"
                    value={form.wabaId}
                    onChange={handleChange('wabaId')}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Building2 size={18} color="#6D6B77" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiInputBase-root': {
                            borderRadius: '12px',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '0.85rem',
                            background: '#fff',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e4e8ee',
                        },
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1daa61',
                        },
                        '& .MuiInputLabel-root': {
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '0.8rem',
                            color: '#6D6B77',
                        },
                    }}
                />
                <Typography
                    sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.75rem',
                        color: '#a0a0a0',
                        mt: -1,
                        ml: 0.5,
                    }}
                >
                    Business Settings &rarr; WhatsApp Accounts
                </Typography>

                <TextField
                    fullWidth
                    label="Phone Number ID"
                    placeholder="e.g. 827023610503270"
                    value={form.phoneId}
                    onChange={handleChange('phoneId')}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Smartphone size={18} color="#6D6B77" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiInputBase-root': {
                            borderRadius: '12px',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '0.85rem',
                            background: '#fff',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e4e8ee',
                        },
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1daa61',
                        },
                        '& .MuiInputLabel-root': {
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '0.8rem',
                            color: '#6D6B77',
                        },
                    }}
                />
                <Typography
                    sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.75rem',
                        color: '#a0a0a0',
                        mt: -1,
                        ml: 0.5,
                    }}
                >
                    Developer Console &rarr; WhatsApp &rarr; API Setup
                </Typography>
            </Box>

            {isFilled && (
                <Alert
                    severity="success"
                    sx={{
                        mt: 2,
                        borderRadius: '12px',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.82rem',
                    }}
                    icon={<CheckCircle2 size={20} />}
                >
                    All credentials filled
                </Alert>
            )}

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mt: 2,
                        borderRadius: '12px',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.82rem',
                    }}
                    icon={<AlertTriangle size={20} />}
                >
                    {error}
                </Alert>
            )}

            {saved && (
                <Alert
                    severity="success"
                    sx={{
                        mt: 2,
                        borderRadius: '12px',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.82rem',
                    }}
                    icon={<CheckCircle2 size={20} />}
                >
                    Credentials saved successfully!
                </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                <Button
                    variant="outlined"
                    onClick={handleClear}
                    sx={{
                        textTransform: 'none',
                        borderRadius: '12px',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#6D6B77',
                        borderColor: '#e4e8ee',
                        px: 3,
                        py: 1,
                        '&:hover': {
                            borderColor: '#e53e3e',
                            color: '#e53e3e',
                            background: 'rgba(229,62,62,0.04)',
                        },
                    }}
                >
                    Clear
                </Button>

                <Button
                    variant="contained"
                    disableElevation
                    onClick={handleSave}
                    disabled={isSaving}
                    startIcon={isSaving ? null : <Save size={18} />}
                    sx={{
                        textTransform: 'none',
                        borderRadius: '12px',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        background: '#1daa61',
                        color: '#fff',
                        px: 3,
                        py: 1,
                        boxShadow: 'none',
                        '&:hover': {
                            background: '#1a9a57',
                            boxShadow: 'none',
                        },
                        '&:disabled': {
                            background: '#9ca3af',
                        },
                    }}
                >
                    {isSaving ? 'Saving...' : 'Save Credentials'}
                </Button>

                {onBack && (
                    <Button
                        onClick={onBack}
                        sx={{
                            textTransform: 'none',
                            borderRadius: '10px',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 500,
                            color: '#6D6B77',
                            ml: 'auto',
                        }}
                    >
                        <ChevronRight size={16} style={{ transform: 'rotate(180deg)', marginRight: 4 }} />
                        Back
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default ManualSetupStep;
