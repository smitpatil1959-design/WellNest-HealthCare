export const colorTokens = {
  brand: {
    50: '#EEF2E7',
    100: '#E1E9D5',
    200: '#C6D6B4',
    300: '#B2C89E',
    400: '#91AD7A',
    500: '#738E62',
    600: '#3F6749',
    700: '#244C3D',
    800: '#173F35',
    900: '#15392F',
    950: '#102D25',
  },
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  sky: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    700: '#0369A1',
    800: '#075985',
  },
  ink: {
    950: '#09131D',
    900: '#0F1D2D',
    800: '#1E2F42',
    700: '#33475B',
    600: '#475E75',
    500: '#647B94',
    400: '#94A5B8',
  },
  surface: {
    white: '#FFFFFF',
    soft: '#F8FAFC',
    muted: '#F1F5F9',
    line: '#E2E8F0',
  },
} as const;

export const radiusTokens = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '28px',
  full: '9999px',
} as const;

export const shadowTokens = {
  sm: '0 1px 3px 0 rgba(15, 29, 45, 0.05), 0 1px 2px -1px rgba(15, 29, 45, 0.05)',
  md: '0 4px 14px -2px rgba(15, 29, 45, 0.06), 0 2px 6px -2px rgba(15, 29, 45, 0.04)',
  lg: '0 12px 28px -4px rgba(15, 29, 45, 0.08), 0 4px 10px -2px rgba(15, 29, 45, 0.04)',
} as const;

export const spacingScale = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128] as const;

export const typography = {
  display: 'Cormorant Garamond, ui-serif, Georgia, serif',
  sans: 'Manrope, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, ui-sans-serif, system-ui, sans-serif',
} as const;
