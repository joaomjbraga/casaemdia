const tintColorLight = '#009394';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Typography = {
  fontSize: {
    xxs: 10,
    xs: 12,
    sm: 13,
    base: 14,
    md: 15,
    lg: 16,
    xl: 17,
    xxl: 18,
    hero: 20,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.5,
  },
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  button: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  }),
} as const;

export default {
  light: {
    background: '#F1F5F9',
    backgroundSecondary: '#FFFFFF',

    text: '#0F172A',
    textWhite: '#FFFFFF',
    mutedText: '#64748B',

    primary: tintColorLight,
    tint: tintColorLight,
    secondary: '#334155',

    cardBackground: '#FFFFFF',
    cardDark: '#F8FAFC',
    cardDarkSecondary: '#E2E8F0',
    cardSurface: '#FFFFFF',
    cardBorder: '#E2E8F0',

    accentBlue: '#009394',
    accentCyan: '#12cec8',
    accentYellow: '#D97706',

    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    inputBackground: '#F8FAFC',
    inputBorder: '#E2E8F0',

    success: '#16A34A',
    successLight: '#22C55E',
    danger: '#DC2626',
    dangerDark: '#B91C1C',
    dangerLight: '#EF4444',
    warning: '#D97706',
    warningLight: '#F59E0B',
    info: '#009394',
    link: '#009394',

    progressBar: '#009394',
    progressBackground: '#E2E8F0',

    buttonPrimary: '#009394',
    buttonSecondary: '#334155',

    iconPrimary: '#009394',
    iconSecondary: '#334155',
    iconLight: '#FFFFFF',

    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,

    gradientStart: '#FFFFFF',
    gradientEnd: '#F1F5F9',
    gradientPurple: '#FFFFFF',
    gradientDark: '#F1F5F9',

    dialogBackground: '#FFFFFF',
  },
};
