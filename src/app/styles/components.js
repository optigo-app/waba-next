/**
 * MUI component overrides used by both light and dark themes.
 * Import the font string so we don't repeat it.
 */

const poppinsFont = "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

export const getComponentOverrides = (mode) => {
  const isDark = mode === 'dark';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        html: { height: '100%' },
        body: {
          fontFamily: poppinsFont,
          backgroundColor: isDark ? '#121212' : '#f5f5f5',
          color: isDark ? '#e0e0e0' : '#444050',
          minHeight: '100%',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '::-webkit-scrollbar-track': {
          background: isDark ? '#1e1e1e' : '#f5f5f5',
        },
        '::-webkit-scrollbar-thumb': {
          background: isDark ? '#424242' : '#bdbdbd',
          borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: isDark ? '#616161' : '#9e9e9e',
        },
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: isDark ? '#424242 #1e1e1e' : '#bdbdbd #f5f5f5',
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          fontFamily: poppinsFont,
          fontWeight: 500,
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 20px',
        },
        containedPrimary: {
          background: 'linear-gradient(270deg, rgba(37, 211, 102, 0.85) 0%, #1daa61 100%)',
          '&:hover': {
            background: 'linear-gradient(270deg, rgba(37, 211, 102, 1) 0%, #1DA851 100%)',
          },
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '10px 24px',
          fontSize: '0.9375rem',
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },

    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
        },
        outlined: {
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: isDark
            ? 'rgba(0, 0, 0, 0.3) 0px 6px 24px, rgba(0, 0, 0, 0.2) 0px 0px 0px 1px'
            : 'rgba(0, 0, 0, 0.05) 0px 6px 24px, rgba(0, 0, 0, 0.03) 0px 0px 0px 1px',
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontFamily: poppinsFont,
          borderRadius: 8,
          '& fieldset': {
            borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
          },
          '&:hover fieldset': {
            borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          },
          '&.Mui-focused fieldset': {
            borderWidth: 1,
          },
        },
        input: {
          fontFamily: poppinsFont,
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: poppinsFont,
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontFamily: poppinsFont,
          },
          '& .MuiInputLabel-root': {
            fontFamily: poppinsFont,
          },
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: poppinsFont,
          fontWeight: 500,
          borderRadius: 6,
          margin: '2px 8px',
          padding: '8px 12px',
        },
      },
    },

    MuiListItem: {
      styleOverrides: {
        root: {
          fontFamily: poppinsFont,
          borderRadius: 8,
        },
      },
    },

    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: poppinsFont,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: poppinsFont,
          fontWeight: 500,
          borderRadius: 6,
        },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        root: {
          fontFamily: poppinsFont,
          fontWeight: 500,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: poppinsFont,
          fontSize: '0.75rem',
          borderRadius: 6,
          padding: '6px 10px',
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },

    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },

    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: poppinsFont,
        },
      },
    },

    MuiDataGrid: {
      styleOverrides: {
        root: {
          fontFamily: poppinsFont,
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5',
          },
        },
      },
    },
  };
};
