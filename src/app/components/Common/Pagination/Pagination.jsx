'use client';

import React from 'react';
import { Box, Typography, FormControl, Select, MenuItem } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPageOptions = [10, 15, 25, 50, 100],
}) => {
    return (
        <Box
            sx={{
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                py: 2,
                backgroundColor: 'transparent',
                zIndex: 1,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: '#fff',
                    borderRadius: '999px',
                    boxShadow: '0 10px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
                    border: '1px solid #e8eaef',
                    px: 2,
                    py: '6px',
                    whiteSpace: 'nowrap',
                    flexWrap: 'nowrap',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#8b8a94', fontFamily: 'Poppins, sans-serif', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        Rows per page
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 48 }}>
                        <Select
                            value={rowsPerPage}
                            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                            variant="standard"
                            disableUnderline
                            sx={{
                                fontSize: '0.875rem',
                                fontFamily: 'Poppins, sans-serif',
                                color: '#444050',
                                fontWeight: 600,
                                '.MuiSelect-select': { py: 0, px: '2px', pr: '18px' },
                                '&:before, &:after': { display: 'none' },
                                '& .MuiSvgIcon-root': { right: 0, color: '#8b8a94' },
                            }}
                            MenuProps={{ PaperProps: { sx: { borderRadius: '10px', mt: 0.5, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' } } }}
                        >
                            {rowsPerPageOptions.map((n) => (
                                <MenuItem key={n} value={n} sx={{ fontSize: '0.875rem', fontFamily: 'Poppins, sans-serif' }}>{n}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ width: 1, height: 14, backgroundColor: '#e4e8ee' }} />

                <Typography sx={{ fontSize: '0.875rem', color: '#444050', fontFamily: 'Poppins, sans-serif', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, count)} of {count}
                </Typography>

                <Box sx={{ width: 1, height: 14, backgroundColor: '#e4e8ee' }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <Box
                        onClick={() => onPageChange(null, Math.max(0, page - 1))}
                        sx={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: page === 0 ? 'not-allowed' : 'pointer',
                            opacity: page === 0 ? 0.3 : 1,
                            color: '#6D6B77',
                            transition: 'all 0.15s',
                            '&:hover': { backgroundColor: page === 0 ? 'transparent' : '#f1f5f9', color: page === 0 ? '#6D6B77' : '#444050' },
                        }}
                    >
                        <ChevronLeft size={15} strokeWidth={2.5} />
                    </Box>
                    <Box
                        onClick={() => onPageChange(null, Math.min(Math.ceil(count / rowsPerPage) - 1, page + 1))}
                        sx={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: page >= Math.ceil(count / rowsPerPage) - 1 ? 'not-allowed' : 'pointer',
                            opacity: page >= Math.ceil(count / rowsPerPage) - 1 ? 0.3 : 1,
                            color: '#6D6B77',
                            transition: 'all 0.15s',
                            '&:hover': { backgroundColor: page >= Math.ceil(count / rowsPerPage) - 1 ? 'transparent' : '#f1f5f9', color: page >= Math.ceil(count / rowsPerPage) - 1 ? '#6D6B77' : '#444050' },
                        }}
                    >
                        <ChevronRight size={15} strokeWidth={2.5} />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Pagination;
