// Global chip styling using theme colors
export const getChipStyles = () => {
  return {
    backgroundColor: 'rgba(29, 170, 97, 0.12)',
    color: 'var(--primary-main)',
    fontWeight: 500,
    '& .MuiChip-deleteIcon': {
      color: 'var(--primary-main)',
      transition: 'color 0.2s ease, transform 0.2s ease',
      '&:hover': {
        color: '#d32f2f',
        transform: 'scale(1.1)',
      },
    },
  };
};
