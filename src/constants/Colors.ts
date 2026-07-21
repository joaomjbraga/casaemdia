const tintColorLight = '#007AFF';

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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  button: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 4,
  }),
} as const;

export default {
  light: {
    background: '#F3F2F9',
    backgroundSecondary: '#FFFFFF',

    text: '#000000',
    textWhite: '#000000',
    mutedText: '#8E8E93',

    primary: tintColorLight,
    tint: tintColorLight,
    secondary: '#5856D6',

    accentPurple: '#AF52DE',

    illustrationPurple: '#AF52DE',
    illustrationPink: '#FF2D55',
    illustrationCyan: '#5AC8FA',
    illustrationYellow: '#FFCC00',
    illustrationOrange: '#FF9500',
    illustrationTeal: '#34C759',

    cardBackground: '#FFFFFF',
    cardDark: '#F2F2F7',
    cardDarkSecondary: '#E5E5EA',
    cardSurface: '#FFFFFF',
    cardBorder: 'rgba(60, 60, 67, 0.08)',

    accentBlue: '#007AFF',
    accentCyan: '#5AC8FA',
    accentYellow: '#FFCC00',

    border: 'rgba(60, 60, 67, 0.08)',
    borderLight: 'rgba(60, 60, 67, 0.04)',

    inputBackground: '#F2F2F7',
    inputBorder: 'rgba(60, 60, 67, 0.08)',

    accentPurpleSurface: 'rgba(175, 82, 222, 0.08)',

    success: '#58cc02',
    successLight: '#7ed321',
    danger: '#ff4b4b',
    dangerDark: '#e63900',
    dangerLight: '#ff6b6b',
    warning: '#ff9600',
    warningLight: '#ffb84d',
    info: '#1cb0f6',
    link: '#1cb0f6',

    progressBar: '#007AFF',
    progressBackground: '#E5E5EA',

    buttonPrimary: '#007AFF',
    buttonSecondary: '#5856D6',

    iconPrimary: '#007AFF',
    iconSecondary: '#5856D6',
    iconLight: '#FFFFFF',

    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,

    gradientStart: '#FFFFFF',
    gradientEnd: '#F2F2F7',
    gradientPurple: '#FFFFFF',
    gradientDark: '#F2F2F7',

    dialogBackground: '#FFFFFF',
  },
};
