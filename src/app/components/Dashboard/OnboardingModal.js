'use client';

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Paper,
} from '@mui/material';
import { Plus, MessageCircle, ChevronRight, CheckCircle2 } from 'lucide-react';

const steps = [
    {
        label: 'Create Channel',
        description: 'Set up a new WhatsApp Business API channel for your organization.',
    },
    {
        label: 'Verify Business',
        description: 'Complete business verification to unlock messaging capabilities.',
    },
    {
        label: 'Connect Phone Number',
        description: 'Link your phone number to start sending and receiving messages.',
    },
    {
        label: 'Go Live',
        description: 'Start messaging your customers at scale.',
    },
];

const OnboardingModal = ({ open, onClose }) => {
    const [activeStep, setActiveStep] = React.useState(0);

    React.useEffect(() => {
        if (open) {
            setActiveStep(0);
        }
    }, [open]);

    const handleNext = () => {
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleFinish = () => {
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                },
            }}
        >
            <DialogTitle
                sx={{
                    pb: 1,
                    pt: 3,
                    px: 3,
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    color: '#444050',
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
            </DialogTitle>

            <DialogContent sx={{ px: 3, pb: 2 }}>
                <Typography
                    variant="body2"
                    sx={{
                        color: '#6D6B77',
                        fontFamily: 'Poppins, sans-serif',
                        mb: 3,
                        fontSize: '0.875rem',
                    }}
                >
                    Follow these steps to set up your new WhatsApp Business channel.
                </Typography>

                <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                        <Step key={step.label}>
                            <StepLabel
                                StepIconProps={{
                                    sx: {
                                        '& .MuiStepIcon-root': {
                                            color: index < activeStep ? '#1daa61 !important' : undefined,
                                        },
                                    },
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontFamily: 'Poppins, sans-serif',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        color: index <= activeStep ? '#444050' : '#6D6B77',
                                    }}
                                >
                                    {step.label}
                                </Typography>
                            </StepLabel>
                            <StepContent>
                                <Typography
                                    sx={{
                                        fontFamily: 'Poppins, sans-serif',
                                        fontSize: '0.82rem',
                                        color: '#6D6B77',
                                        mb: 1,
                                    }}
                                >
                                    {step.description}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={handleNext}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: '10px',
                                            fontFamily: 'Poppins, sans-serif',
                                            fontWeight: 600,
                                            background: '#1daa61',
                                            boxShadow: 'none',
                                            '&:hover': { background: '#1a9a57', boxShadow: 'none' },
                                        }}
                                        endIcon={<ChevronRight size={16} />}
                                    >
                                        {index === steps.length - 1 ? 'Finish' : 'Continue'}
                                    </Button>
                                    {index > 0 && (
                                        <Button
                                            size="small"
                                            onClick={handleBack}
                                            sx={{
                                                textTransform: 'none',
                                                borderRadius: '10px',
                                                fontFamily: 'Poppins, sans-serif',
                                                color: '#6D6B77',
                                            }}
                                        >
                                            Back
                                        </Button>
                                    )}
                                </Box>
                            </StepContent>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === steps.length && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            mt: 2,
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                            border: '1px solid rgba(29, 170, 97, 0.2)',
                            textAlign: 'center',
                        }}
                    >
                        <CheckCircle2 size={40} color="#1daa61" style={{ marginBottom: 8 }} />
                        <Typography
                            sx={{
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                color: '#166534',
                            }}
                        >
                            All steps completed!
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: 'Poppins, sans-serif',
                                fontSize: '0.85rem',
                                color: '#166534',
                                mt: 0.5,
                            }}
                        >
                            You&apos;re ready to start using your new channel.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleFinish}
                            sx={{
                                mt: 2,
                                textTransform: 'none',
                                borderRadius: '10px',
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 600,
                                background: '#1daa61',
                                boxShadow: 'none',
                                '&:hover': { background: '#1a9a57', boxShadow: 'none' },
                            }}
                        >
                            Get Started
                        </Button>
                    </Paper>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    onClick={onClose}
                    sx={{
                        textTransform: 'none',
                        borderRadius: '10px',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 500,
                        color: '#6D6B77',
                    }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default OnboardingModal;
