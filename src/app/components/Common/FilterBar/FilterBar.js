'use client';

import React from 'react';
import {
    Box,
    InputBase,
    Paper,
    Chip,
    FormControl,
    Select,
    MenuItem,
} from '@mui/material';
import { Search, ArrowDownUp } from 'lucide-react';

const FilterBar = ({
    search,
    onSearchChange,
    searchPlaceholder = 'Search...',
    sortBy,
    onSortChange,
    sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'name', label: 'Name (A-Z)' },
    ],
    filterChips = [],
    activeFilter,
    onFilterChange,
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                flexWrap: 'wrap',
                px: 1.5,
                py: 1,
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid var(--sidebar-borderColor)',
                flexShrink: 0,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    px: '0.875rem',
                    py: '5px',
                    flex: 1,
                    minWidth: 200,
                    maxWidth: 320,
                    background: '#fff',
                    transition: 'border-color 0.2s',
                    '&:focus-within': {
                        borderColor: '#1daa61',
                        boxShadow: '0 0 0 3px rgba(29, 170, 97, 0.08)',
                    },
                }}
            >
                <Search size={16} color="#94a3b8" />
                <InputBase
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    sx={{
                        ml: '0.5rem',
                        flex: 1,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.82rem',
                        color: '#444050',
                        '& input::placeholder': { color: '#94a3b8', opacity: 1 },
                    }}
                />
            </Paper>

            {
                filterChips.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 140, mr: 1 }}>
                            <Select
                                value={sortBy}
                                onChange={(e) => onSortChange(e.target.value)}
                                displayEmpty
                                IconComponent={() => <ArrowDownUp size={14} color="#6b7280" style={{ marginRight: 8 }} />}
                                sx={{
                                    borderRadius: '10px',
                                    fontFamily: 'Poppins, sans-serif',
                                    fontSize: '0.82rem',
                                    color: '#444050',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1daa61' },
                                }}
                            >
                                {sortOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.82rem' }}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {filterChips.map((chip) => {
                            const isActive = activeFilter === chip.value;
                            return (
                                <Chip
                                    key={chip.value}
                                    label={chip.label}
                                    onClick={() => onFilterChange(chip.value)}
                                    sx={{
                                        borderRadius: '8px',
                                        fontFamily: 'Poppins, sans-serif',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        height: 28,
                                        cursor: 'pointer',
                                        background: isActive ? '#1daa61' : '#f1f5f9',
                                        color: isActive ? '#fff' : '#64748b',
                                        '&:hover': {
                                            background: isActive ? '#1a9a57' : '#e2e8f0',
                                        },
                                    }}
                                />
                            );
                        })}
                    </Box>
                )
            }
        </Box >
    );
};

export default FilterBar;
