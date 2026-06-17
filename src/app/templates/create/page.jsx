'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { FilePlus } from 'lucide-react';

const CreateTemplatePage = () => {
    return (
        <Box sx={{ padding: '2rem', background: '#f8f9fa', minHeight: '100vh' }}>
            <Box sx={{ pb: '1.5rem', borderBottom: '1px solid #e4e8ee' }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontSize: '1.6rem',
                        fontWeight: 700,
                        color: '#444050',
                        fontFamily: 'Poppins, sans-serif',
                    }}
                >
                    Create Template
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        fontSize: '0.875rem',
                        color: '#6D6B77',
                        mt: '0.35rem',
                        fontFamily: 'Poppins, sans-serif',
                    }}
                >
                    Build a new WhatsApp message template
                </Typography>
            </Box>

            <Box sx={{ marginTop: '2rem' }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: '3rem',
                        borderRadius: '16px',
                        border: '1px solid #e4e8ee',
                        textAlign: 'center',
                        background: '#fff',
                    }}
                >
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '18px',
                            background: 'linear-gradient(135deg, rgba(29,170,97,0.08), rgba(37,211,102,0.05))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(29,170,97,0.12)',
                            mx: 'auto',
                            mb: '1.5rem',
                        }}
                    >
                        <FilePlus size={28} color="#1daa61" />
                    </Box>
                    <Typography
                        sx={{
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: '#444050',
                        }}
                    >
                        Template Builder
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '0.875rem',
                            color: '#6D6B77',
                            mt: '0.5rem',
                        }}
                    >
                        The full template builder is coming soon. Components are ready at <code>components/Template/Create/</code>.
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
};

export default CreateTemplatePage;
