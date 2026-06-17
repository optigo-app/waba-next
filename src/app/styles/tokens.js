/**
 * Design tokens that change based on color mode.
 * Keeps the MUI palette clean and places app-specific tokens under `custom`.
 */

export const getTokens = (mode) => {
  const isDark = mode === 'dark';

  return {
    /* ─── Standard MUI Palette ─── */
    palette: {
      mode,
      primary: {
        main: '#1daa61',
        light: '#4cdb8d',
        dark: '#128C7E',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#128C7E',
        light: '#1daa61',
        dark: '#075E54',
        contrastText: '#ffffff',
      },
      success: {
        main: '#1daa61',
        light: isDark ? '#1b5e20' : '#c8e6c9',
        dark: '#2e7d32',
        contrastText: '#ffffff',
      },
      error: {
        main: '#d32f2f',
        light: isDark ? '#b71c1c' : '#ffcdd2',
        dark: '#c62828',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#ed6c02',
        light: isDark ? '#e65100' : '#ffe0b2',
        dark: '#e65100',
        contrastText: '#ffffff',
      },
      info: {
        main: '#00CFE8',
        light: isDark ? '#01579b' : '#b3e5fc',
        dark: '#0097a7',
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#121212' : '#f5f5f5',
        paper: isDark ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e0e0e0' : '#444050',
        secondary: isDark ? '#a0a0a0' : '#7D7f85',
        disabled: isDark ? '#666666' : '#9e9e9e',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      action: {
        active: isDark ? 'rgba(255, 255, 255, 0.54)' : 'rgba(0, 0, 0, 0.54)',
        hover: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        hoverOpacity: 0.08,
        selected: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
        selectedOpacity: 0.16,
        disabled: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
        disabledBackground: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        disabledOpacity: 0.38,
        focus: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        focusOpacity: 0.12,
        activatedOpacity: 0.24,
      },
      grey: {
        50: isDark ? '#212121' : '#fafafa',
        100: isDark ? '#1e1e1e' : '#f5f5f5',
        200: isDark ? '#2a2a2a' : '#eeeeee',
        300: isDark ? '#424242' : '#e0e0e0',
        400: isDark ? '#616161' : '#bdbdbd',
        500: isDark ? '#757575' : '#9e9e9e',
        600: isDark ? '#9e9e9e' : '#757575',
        700: isDark ? '#bdbdbd' : '#616161',
        800: isDark ? '#e0e0e0' : '#424242',
        900: isDark ? '#f5f5f5' : '#212121',
      },
    },

    /* ─── App-Specific Tokens (theme.custom) ─── */
    custom: {
      colors: {
        whatsappGreen: '#1daa61',
        whatsappDark: '#075E54',
        blue: '#007bfc',
        highlight: '#1daa61',
        lightGreenBg: isDark ? '#1b3328' : '#dcf8e6',
      },
      gradients: {
        primary: 'linear-gradient(270deg, rgba(37, 211, 102, 0.85) 0%, #1daa61 100%)',
        lowImportance: isDark
          ? 'linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%)'
          : 'linear-gradient(135deg, #f7f7f7 0%, #e5e5e5 100%)',
      },
      shadows: {
        card: isDark
          ? 'rgba(0, 0, 0, 0.3) 0px 6px 24px, rgba(0, 0, 0, 0.2) 0px 0px 0px 1px'
          : 'rgba(0, 0, 0, 0.05) 0px 6px 24px, rgba(0, 0, 0, 0.03) 0px 0px 0px 1px',
        elevated: isDark
          ? '0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.25)'
          : '0 4px 16px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08)',
      },
      importance: {
        high: {
          background: 'linear-gradient(270deg, rgba(37, 211, 102, 0.85) 0%, #1daa61 100%)',
          text: isDark ? '#ffffff' : '#444050',
        },
        low: {
          background: isDark
            ? 'linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%)'
            : 'linear-gradient(135deg, #f7f7f7 0%, #e5e5e5 100%)',
          text: isDark ? '#e0e0e0' : '#444050',
        },
      },
    },
  };
};
