export const colors = {
  bg: {
    primary: '#0b0d12',
    elevated: '#10131b',
    input: '#10131b',
    hover: '#151924',
  },

  border: {
    primary: '#262a35',
    secondary: '#1c202b',
    subtle: '#1c202b',
  },

  text: {
    primary: '#ece9e0',
    secondary: '#c9c5b8',
    tertiary: '#a5a194',
    muted: '#7d7a6e',
    faded: '#6f6c61',
  },

  accent: {
    green: '#d41f3d',
    greenHover: '#e8354f',
    red: '#e8354f',
    redBright: '#d41f3d',
    sovietRed: '#b3122e',
    yellow: '#c8860a',
    orange: '#c8860a',
  },

  state: {
    success: '#2d8a4e',
    error: '#d41f3d',
    warning: '#c8860a',
  }
}

export const typography = {
  fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
  fontFamilyMono: "'JetBrains Mono', 'Courier New', monospace",

  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '14px',
    md: '15px',
    lg: '18px',
    xl: '28px',
  },

  fontWeight: {
    normal: 400,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  }
}

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px',
}

export const layout = {
  maxWidth: '1200px',
  borderRadius: '0px',
}

export const commonStyles = {
  pageContainer: {
    minHeight: 'calc(100vh - 64px)',
    backgroundColor: colors.bg.primary,
    color: colors.text.primary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.base,
    padding: `${spacing.lg} ${spacing.xl}`,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },

  card: {
    border: `1px solid ${colors.border.primary}`,
    backgroundColor: colors.bg.elevated,
    padding: spacing.lg,
  },

  input: {
    width: '100%',
    padding: spacing.sm,
    backgroundColor: colors.bg.input,
    border: `1px solid ${colors.border.primary}`,
    color: colors.text.primary,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.base,
    boxSizing: 'border-box',
  },

  link: {
    color: colors.accent.green,
    textDecoration: 'underline',
    cursor: 'pointer',
  },

  buttonPrimary: {
    padding: `6px ${spacing.lg}`,
    backgroundColor: 'transparent',
    border: `1px solid ${colors.accent.green}`,
    color: colors.accent.green,
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.base,
  },

  buttonSecondary: {
    padding: `6px ${spacing.lg}`,
    backgroundColor: 'transparent',
    border: `1px solid ${colors.text.muted}`,
    color: colors.text.muted,
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.base,
  },

  buttonDanger: {
    padding: `6px ${spacing.lg}`,
    backgroundColor: 'transparent',
    border: `1px solid ${colors.state.error}`,
    color: colors.state.error,
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.base,
  },
}
