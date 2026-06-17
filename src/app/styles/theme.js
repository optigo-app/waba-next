import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { getTokens } from './tokens';
import { getComponentOverrides } from './components';

const poppinsFont = "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

/**
 * Build a complete MUI theme for the given mode.
 * - Uses design tokens for palette + app-specific values
 * - Applies component overrides for consistent UX
 * - Enables responsive font sizes across breakpoints
 */
export const getTheme = (mode = 'light') => {
  const tokens = getTokens(mode);

  let theme = createTheme({
    palette: tokens.palette,
    custom: tokens.custom,
    typography: {
      fontFamily: poppinsFont,
      h1: {
        fontFamily: poppinsFont,
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
      },
      h2: {
        fontFamily: poppinsFont,
        fontWeight: 600,
        fontSize: '2rem',
        lineHeight: 1.3,
      },
      h3: {
        fontFamily: poppinsFont,
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.3,
      },
      h4: {
        fontFamily: poppinsFont,
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
      },
      h5: {
        fontFamily: poppinsFont,
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.4,
      },
      h6: {
        fontFamily: poppinsFont,
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 1.4,
      },
      subtitle1: {
        fontFamily: poppinsFont,
        fontWeight: 500,
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      subtitle2: {
        fontFamily: poppinsFont,
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      body1: {
        fontFamily: poppinsFont,
        fontWeight: 400,
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontFamily: poppinsFont,
        fontWeight: 400,
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        fontFamily: poppinsFont,
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: 1.75,
        textTransform: 'none',
      },
      caption: {
        fontFamily: poppinsFont,
        fontWeight: 400,
        fontSize: '0.75rem',
        lineHeight: 1.66,
      },
      overline: {
        fontFamily: poppinsFont,
        fontWeight: 400,
        fontSize: '0.75rem',
        lineHeight: 2.66,
        textTransform: 'uppercase',
      },
    },
    shape: {
      borderRadius: 8,
    },
    spacing: 8,
    components: getComponentOverrides(mode),
  });

  /* Responsive font scaling across breakpoints */
  theme = responsiveFontSizes(theme, {
    breakpoints: ['xs', 'sm', 'md', 'lg'],
    factor: 2,
  });

  return theme;
};

/* Pre-built instances for direct import */
export const lightTheme = getTheme('light');
export const darkTheme = getTheme('dark');

export default getTheme; 