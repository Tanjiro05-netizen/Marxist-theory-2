import { createTheme, createThemeContract, globalStyle, keyframes, style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

export const vars = createThemeContract({
  color: {
    background: '',
    surface: '',
    surfaceRaised: '',
    surfaceSoft: '',
    overlay: '',
    border: '',
    borderStrong: '',
    borderAccent: '',
    accent: '',
    accentHover: '',
    accentSoft: '',
    accentWash: '',
    accentGlow: '',
    spotlight: '',
    text: '',
    textSoft: '',
    textMuted: '',
    textFaint: '',
    success: '',
    warning: '',
    info: '',
  },
  font: {
    display: '',
    body: '',
    mono: '',
    label: '',
  },
  space: {
    xxs: '',
    xs: '',
    sm: '',
    md: '',
    lg: '',
    xl: '',
    xxl: '',
    xxxl: '',
    hero: '',
    gutter: '',
  },
  radius: {
    tiny: '',
    sm: '',
    md: '',
    lg: '',
    xl: '',
    pill: '',
  },
  shadow: {
    soft: '',
    panel: '',
    glow: '',
  },
  layout: {
    maxWidth: '',
    rail: '',
  },
  border: {
    subtle: '',
    strong: '',
    accent: '',
  },
});

export const studyThemeClass = createTheme(vars, {
  color: {
    background: '#0b0d12',
    surface: '#10131b',
    surfaceRaised: '#151924',
    surfaceSoft: '#1a1f2b',
    overlay: '#151924',
    border: 'rgba(236, 233, 224, 0.08)',
    borderStrong: '#262a35',
    borderAccent: 'rgba(179, 18, 46, 0.45)',
    accent: '#b3122e',
    accentHover: '#d41f3d',
    accentSoft: 'rgba(179, 18, 46, 0.16)',
    accentWash: 'rgba(179, 18, 46, 0.08)',
    accentGlow: 'rgba(179, 18, 46, 0.28)',
    spotlight: 'rgba(236, 233, 224, 0.04)',
    text: '#ece9e0',
    textSoft: '#c9c5b8',
    textMuted: '#a5a194',
    textFaint: '#6f6c61',
    success: '#2d8a4e',
    warning: '#c8860a',
    info: '#4a7fb5',
  },
  font: {
    display: 'var(--font-cormorant, \'Cormorant Garamond\'), Georgia, "Times New Roman", serif',
    body: 'var(--font-newsreader, \'Newsreader\'), Georgia, "Times New Roman", serif',
    mono: 'var(--font-jetbrains, \'JetBrains Mono\'), \'Fira Code\', SFMono-Regular, Menlo, monospace',
    label: 'var(--font-outfit, \'Outfit\'), system-ui, -apple-system, sans-serif',
  },
  space: {
    xxs: '4px',
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '40px',
    xxxl: '56px',
    hero: '72px',
    gutter: '24px',
  },
  radius: {
    tiny: '0px',
    sm: '0px',
    md: '0px',
    lg: '2px',
    xl: '2px',
    pill: '999px',
  },
  shadow: {
    soft: '0 1px 2px rgba(0, 0, 0, 0.4)',
    panel: '0 14px 36px rgba(0, 0, 0, 0.5)',
    glow: 'none',
  },
  layout: {
    maxWidth: '1380px',
    rail: '360px',
  },
  border: {
    subtle: '1px solid #1c202b',
    strong: '1px solid #262a35',
    accent: '1px solid rgba(179, 18, 46, 0.45)',
  },
});

const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

export const themeRoot = style({
  position: 'relative',
  minHeight: '100%',
  background: vars.color.background,
  color: vars.color.text,
  fontFamily: vars.font.body,
  isolation: 'isolate',
});

globalStyle(`${studyThemeClass}`, {
  color: vars.color.text,
  backgroundColor: vars.color.background,
  fontFamily: vars.font.body,
});

globalStyle(`${studyThemeClass} *`, {
  boxSizing: 'border-box',
});

globalStyle(`${studyThemeClass} a`, {
  textDecoration: 'none',
});

/* Only classless anchors inherit — this must never out-rank a component's
   own color class (e.g. the ink links on the paper navband). */
globalStyle(`${studyThemeClass} a:not([class])`, {
  color: 'inherit',
});

globalStyle(`${studyThemeClass} button`, {
  fontFamily: vars.font.body,
});

globalStyle(`${studyThemeClass} input`, {
  fontFamily: vars.font.body,
});

globalStyle(`${studyThemeClass} input::placeholder`, {
  color: vars.color.textFaint,
});

globalStyle(`${studyThemeClass} ::selection`, {
  background: vars.color.accent,
  color: '#ffffff',
});

/* Ambient glow blobs are retired with this theme — neutralized, not deleted. */
export const ambientOrb = style({
  display: 'none',
});

export const panelBase = style({
  position: 'relative',
  background: vars.color.surface,
  border: vars.border.subtle,
  borderRadius: vars.radius.tiny,
});

export const panelInset = style({
  background: vars.color.surfaceRaised,
  border: vars.border.subtle,
  borderRadius: vars.radius.tiny,
});

export const sectionHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: vars.space.lg,
  alignItems: 'flex-end',
  marginBottom: vars.space.xl,
  '@media': {
    'screen and (max-width: 820px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      marginBottom: vars.space.lg,
    },
  },
});

export const sectionHeaderStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
});

export const sectionEyebrow = style({
  margin: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.28em',
  color: vars.color.accentHover,
  selectors: {
    '&::before': {
      content: '""',
      display: 'inline-block',
      width: '18px',
      height: '1px',
      background: vars.color.accentHover,
      flexShrink: 0,
    },
  },
});

export const sectionTitle = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '40px',
  lineHeight: 1.05,
  fontWeight: 500,
  letterSpacing: '0.01em',
  color: vars.color.text,
  '@media': {
    'screen and (max-width: 640px)': {
      fontSize: '32px',
    },
  },
});

export const panelTitle = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '30px',
  lineHeight: 1.1,
  fontWeight: 500,
  letterSpacing: '0.01em',
  color: vars.color.text,
});

export const sectionDescription = style({
  margin: 0,
  maxWidth: '700px',
  fontSize: '15px',
  lineHeight: 1.8,
  fontFamily: vars.font.body,
  color: vars.color.textMuted,
});

export const panelDescription = style({
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.75,
  fontFamily: vars.font.body,
  color: vars.color.textMuted,
});

export const monoMeta = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.textFaint,
});

export const iconFrame = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '42px',
  height: '42px',
  borderRadius: vars.radius.tiny,
  background: vars.color.accentWash,
  border: vars.border.accent,
  color: vars.color.accentHover,
  flexShrink: 0,
});

export const divider = style({
  width: '100%',
  height: '1px',
  background: vars.color.borderStrong,
});

export const textLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  color: vars.color.accentHover,
  fontFamily: vars.font.label,
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  paddingBottom: '3px',
  backgroundImage: `linear-gradient(${vars.color.accentHover}, ${vars.color.accentHover})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'left bottom',
  backgroundSize: '0% 1px',
  transition: 'background-size 240ms ease, color 240ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.text,
      backgroundSize: '100% 1px',
    },
  },
});

/* A crimson rule that wipes in behind a row when the row is hovered.
   Layer onto any position:relative row. */
export const ruleWipe = style({
  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '1px',
      background: vars.color.accent,
      transform: 'scaleX(0)',
      transformOrigin: 'left center',
      transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
      pointerEvents: 'none',
    },
    '&:hover::after': {
      transform: 'scaleX(1)',
    },
  },
});

export const actionButton = recipe({
  base: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vars.space.xs,
    borderRadius: vars.radius.tiny,
    border: 'none',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'background-size 240ms cubic-bezier(0.22, 1, 0.36, 1), color 200ms ease, border-color 200ms ease, background-color 200ms ease',
    fontFamily: vars.font.label,
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    selectors: {
      '&:focus-visible': {
        outline: `2px solid ${vars.color.accentHover}`,
        outlineOffset: '2px',
      },
      '&:disabled': {
        opacity: 0.4,
        cursor: 'not-allowed',
      },
    },
  },
  variants: {
    tone: {
      accent: {
        background: vars.color.accent,
        color: '#ffffff',
        selectors: {
          '&:hover:not(:disabled)': {
            background: vars.color.accentHover,
          },
        },
      },
      ghost: {
        background: 'transparent',
        color: vars.color.text,
        border: vars.border.strong,
        selectors: {
          '&:hover:not(:disabled)': {
            color: vars.color.accentHover,
            borderColor: vars.color.accentHover,
          },
        },
      },
      subtle: {
        background: 'transparent',
        color: vars.color.textMuted,
        border: vars.border.subtle,
        selectors: {
          '&:hover:not(:disabled)': {
            color: vars.color.text,
            borderColor: vars.color.accentHover,
            backgroundColor: vars.color.accentWash,
          },
        },
      },
    },
    size: {
      sm: {
        minHeight: '34px',
        padding: `0 ${vars.space.md}`,
      },
      md: {
        minHeight: '40px',
        padding: `0 ${vars.space.lg}`,
      },
    },
  },
  defaultVariants: {
    tone: 'ghost',
    size: 'md',
  },
});

export const filterPill = recipe({
  base: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: vars.space.xs,
    minHeight: '36px',
    padding: `0 2px ${vars.space.sm}`,
    borderRadius: vars.radius.tiny,
    border: 'none',
    background: 'transparent',
    color: vars.color.textMuted,
    fontFamily: vars.font.label,
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    transition: 'color 200ms ease',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    selectors: {
      '&::after': {
        content: '""',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 4,
        height: '1px',
        background: vars.color.accentHover,
        transform: 'scaleX(0)',
        transformOrigin: 'left center',
        transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
      '&:hover': {
        color: vars.color.text,
      },
      '&:hover::after': {
        transform: 'scaleX(1)',
      },
      '&:focus-visible': {
        outline: `2px solid ${vars.color.accentHover}`,
        outlineOffset: '2px',
      },
    },
  },
  variants: {
    active: {
      true: {
        color: vars.color.accentHover,
        selectors: {
          '&::after': {
            transform: 'scaleX(1)',
          },
        },
      },
      false: {},
    },
  },
  defaultVariants: {
    active: false,
  },
});

export const badge = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '20px',
    padding: '0 9px',
    borderRadius: vars.radius.tiny,
    fontFamily: vars.font.label,
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    border: vars.border.strong,
    background: 'transparent',
    fontVariantNumeric: 'tabular-nums',
  },
  variants: {
    tone: {
      default: {
        color: vars.color.textMuted,
      },
      accent: {
        color: vars.color.accentHover,
        borderColor: vars.color.borderAccent,
      },
      success: {
        color: vars.color.success,
        borderColor: 'rgba(45, 138, 78, 0.45)',
      },
      warning: {
        color: vars.color.warning,
        borderColor: 'rgba(200, 134, 10, 0.45)',
      },
      info: {
        color: vars.color.info,
        borderColor: 'rgba(74, 127, 181, 0.45)',
      },
    },
  },
  defaultVariants: {
    tone: 'default',
  },
});

export const emptyState = style({
  padding: `${vars.space.xxl} ${vars.space.lg}`,
  textAlign: 'center',
  color: vars.color.textMuted,
  fontSize: '14px',
  lineHeight: 1.7,
  border: vars.border.subtle,
  borderRadius: vars.radius.tiny,
  background: vars.color.surface,
});

export const loadingState = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '160px',
});

export const loadingSpinner = style({
  width: '26px',
  height: '26px',
  borderRadius: '50%',
  border: `2px solid ${vars.color.borderStrong}`,
  borderTopColor: vars.color.accentHover,
  animation: `${spin} 800ms linear infinite`,
});

/* ── Centered page header — the publication masthead pattern for every page ── */

export const pageHeader = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: vars.space.md,
  paddingTop: vars.space.xxxl,
  paddingBottom: vars.space.xxl,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
});

export const pageKicker = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.32em',
  color: vars.color.accentHover,
});

export const pageTitle = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: 'clamp(40px, 6vw, 64px)',
  fontWeight: 500,
  letterSpacing: '0.01em',
  lineHeight: 1.02,
  color: vars.color.text,
});

export const pageRule = style({
  width: '44px',
  height: '2px',
  background: vars.color.accent,
});

export const pageNote = style({
  margin: 0,
  maxWidth: '620px',
  fontSize: '15px',
  lineHeight: 1.85,
  fontFamily: vars.font.body,
  color: vars.color.textMuted,
});

export const pageActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: vars.space.sm,
  marginTop: vars.space.xs,
});

/* ── Hairline grid — cards share walls through 1px gaps, no free-floating boxes ── */

export const hairlineGrid = style({
  display: 'grid',
  gap: '1px',
  background: vars.color.borderStrong,
  border: vars.border.subtle,
});

export const hairlineCell = style({
  position: 'relative',
  background: vars.color.surface,
});

/* ── Reading prose with a crimson serif drop cap ── */

export const dropCap = style({
  selectors: {
    '&::first-letter': {
      fontFamily: vars.font.display,
      fontWeight: 600,
      fontSize: '3.4em',
      float: 'left',
      lineHeight: 0.8,
      paddingRight: '0.14em',
      paddingTop: '0.06em',
      color: vars.color.accentHover,
    },
  },
});
