'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Paper,
    Fade,
} from '@mui/material';
import {
    Plus,
    MessageCircle,
    ArrowLeft,
    X,
} from 'lucide-react';
import EmbeddedSignupStep from './EmbeddedSignupStep';
import ConfettiCanvas from './ConfettiCanvas';

const OnboardingModal = ({ open, onClose, onChannelAdded }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [completedData, setCompletedData] = useState(null);

    useEffect(() => {
        if (open) {
            setActiveStep(0);
            setCompletedData(null);
        }
    }, [open]);

    const handleSignupSuccess = useCallback((data) => {
        setCompletedData(data);
        if (onChannelAdded) {
            onChannelAdded(data);
        }
        setActiveStep(1);
    }, [onChannelAdded]);

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep((prev) => prev - 1);
        }
    };

    const handleFinish = () => {
        onClose();
    };

    const renderStepContent = () => {
        if (activeStep === 0) {
            return (
                <EmbeddedSignupStep
                    onSuccess={handleSignupSuccess}
                />
            );
        }

        if (activeStep === 1) {
            return (
                <Box sx={{ position: 'relative', py: 4, textAlign: 'center' }}>
                    <ConfettiCanvas active={activeStep === 1} duration={3500} />
                    <Box
                        sx={{
                            width: 72,
                            height: 72,
                            borderRadius: '24px',
                            background: 'linear-gradient(135deg, rgba(29,170,97,0.12), rgba(37,211,102,0.08))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(29,170,97,0.2)',
                            mx: 'auto',
                            mb: 2.5,
                            position: 'relative',
                            zIndex: 2,
                        }}
                    >
                        <CheckCircle2 size={36} color="#1daa61" />
                    </Box>
                    <Typography
                        sx={{
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            fontSize: '1.15rem',
                            color: '#444050',
                            mb: 1,
                            position: 'relative',
                            zIndex: 2,
                        }}
                    >
                        Channel Connected!
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '0.85rem',
                            color: '#6D6B77',
                            mb: 3,
                            maxWidth: 360,
                            mx: 'auto',
                            lineHeight: 1.6,
                            position: 'relative',
                            zIndex: 2,
                        }}
                    >
                        Your WhatsApp Business account has been connected successfully.
                        You can now create templates and send messages.
                    </Typography>

                    {completedData && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: '14px',
                                border: '1px solid #e4e8ee',
                                background: '#fafafa',
                                maxWidth: 360,
                                mx: 'auto',
                                mb: 3,
                                textAlign: 'left',
                                position: 'relative',
                                zIndex: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <MessageCircle size={16} color="#1daa61" />
                                <Typography
                                    sx={{
                                        fontFamily: 'Poppins, sans-serif',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        color: '#444050',
                                    }}
                                >
                                    Account Details
                                </Typography>
                            </Box>
                            {completedData.phoneId && (
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.78rem', color: '#6D6B77', mb: 0.5 }}>
                                    <strong>Phone ID:</strong> {completedData.phoneId}
                                </Typography>
                            )}
                            {completedData.wabaId && (
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.78rem', color: '#6D6B77', mb: 0.5 }}>
                                    <strong>WABA ID:</strong> {completedData.wabaId}
                                </Typography>
                            )}
                            {completedData.name && (
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.78rem', color: '#6D6B77' }}>
                                    <strong>Name:</strong> {completedData.name}
                                </Typography>
                            )}
                        </Paper>
                    )}

                    <Button
                        variant="contained"
                        disableElevation
                        onClick={handleFinish}
                        sx={{
                            textTransform: 'none',
                            borderRadius: '12px',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            background: '#1daa61',
                            px: 4,
                            py: 1,
                            boxShadow: 'none',
                            position: 'relative',
                            zIndex: 2,
                            '&:hover': { background: '#1a9a57', boxShadow: 'none' },
                        }}
                    >
                        Get Started
                    </Button>
                </Box>
            );
        }

        return null;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: '20px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                        maxWidth: 720,
                        minHeight: activeStep === 0 ? 560 : 440,
                        transition: 'min-height 0.45s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    pb: 1.5,
                    pt: 3,
                    px: 3,
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    color: '#444050',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #1daa61, #25d366)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Plus size={20} color="#fff" />
                    </Box>
                    Add New Channel
                </Box>
                <Button
                    onClick={onClose}
                    sx={{
                        textTransform: 'none',
                        borderRadius: '10px',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 500,
                        color: '#6D6B77',
                        fontSize: '0.85rem',
                        minWidth: 'auto',
                        p: '6px 12px',
                    }}
                >
                    <X size={16} />
                </Button>
            </DialogTitle>

            <DialogContent sx={{ px: 3, pb: 2 }}>
                <Fade in timeout={350} key={`step-${activeStep}`} unmountOnExit>
                    <Box>
                        {renderStepContent()}
                    </Box>
                </Fade>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'space-between' }}>
                {activeStep === 1 ? (
                    <Button
                        onClick={handleBack}
                        startIcon={<ArrowLeft size={16} />}
                        sx={{
                            textTransform: 'none',
                            borderRadius: '10px',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 500,
                            color: '#6D6B77',
                            fontSize: '0.85rem',
                        }}
                    >
                        Back
                    </Button>
                ) : (
                    <Box />
                )}
                <Button
                    onClick={onClose}
                    startIcon={activeStep === 1 ? <X size={16} /> : null}
                    sx={{
                        textTransform: 'none',
                        borderRadius: '10px',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 500,
                        color: '#6D6B77',
                        fontSize: '0.85rem',
                    }}
                >
                    {activeStep === 1 ? 'Close' : 'Cancel'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default OnboardingModal;
