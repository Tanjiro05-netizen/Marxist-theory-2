import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/obsidianTheme.css.ts';

export const root = style({
  display: 'grid',
  gridTemplateColumns: '260px minmax(0, 1fr)',
  gap: vars.space.xxl,
  alignItems: 'start',
  '@media': {
    'screen and (max-width: 1023px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

/* ── Chapter rail ── */

export const rail = style({
  position: 'sticky',
  top: '72px',
  maxHeight: 'calc(100vh - 96px)',
  overflowY: 'auto',
  '@media': {
    'screen and (max-width: 1023px)': {
      display: 'none',
    },
  },
});

export const railHeader = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.28em',
  color: vars.color.accentHover,
  paddingBottom: vars.space.sm,
  borderBottom: `1px solid ${vars.color.borderStrong}`,
  marginBottom: vars.space.sm,
});

export const railItem = style({
  position: 'relative',
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: `${vars.space.xs} ${vars.space.sm} ${vars.space.xs} ${vars.space.md}`,
  background: 'transparent',
  border: 'none',
  borderLeft: `2px solid transparent`,
  fontFamily: vars.font.body,
  fontSize: '13px',
  lineHeight: 1.45,
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'color 160ms ease, border-color 160ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
});

export const railItemActive = style({
  color: vars.color.text,
  borderLeftColor: vars.color.accent,
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
});

export const railDepth = {
  paddingLeft: `calc(${vars.space.md} + 12px)`,
};

/* ── Reading shell ── */

export const shell = style({
  position: 'relative',
  height: 'calc(100vh - 210px)',
  minHeight: '560px',
  overflowY: 'auto',
  borderBottom: vars.border.subtle,
  scrollbarWidth: 'thin',
});

export const progressTrack = style({
  position: 'sticky',
  top: 0,
  zIndex: 5,
  height: '2px',
  background: vars.color.surfaceSoft,
});

export const progressFill = style({
  height: '100%',
  background: vars.color.accent,
  transition: 'width 300ms ease',
});

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  padding: `${vars.space.sm} 0`,
  borderBottom: `1px solid ${vars.color.borderStrong}`,
  marginBottom: vars.space.xl,
});

export const chapterMeta = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.md,
  minWidth: 0,
});

export const chapterLabel = style({
  fontFamily: vars.font.body,
  fontSize: '14px',
  color: vars.color.text,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const chapterIndex = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  color: vars.color.textFaint,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
});

export const sizeControls = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xxs,
  flexShrink: 0,
});

export const sizeBtn = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '30px',
  background: 'transparent',
  border: vars.border.subtle,
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'color 160ms ease, border-color 160ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.accentHover,
      borderColor: vars.color.accentHover,
    },
  },
});

export const sizeValue = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.12em',
  color: vars.color.textFaint,
  minWidth: '38px',
  textAlign: 'center',
  fontVariantNumeric: 'tabular-nums',
});

/* ── The column itself ── */

export const column = style({
  maxWidth: '680px',
  margin: '0 auto',
  paddingBottom: vars.space.xxxl,
});

export const section = style({
  fontSize: '1em',
  lineHeight: 1.95,
  fontFamily: vars.font.body,
  fontWeight: 300,
  color: vars.color.textSoft,
  selectors: {},
});

export const sectionRule = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  maxWidth: '680px',
  margin: `${vars.space.xxl} auto`,
});

export const loading = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  minHeight: '320px',
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
});

export const errorBox = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.md,
  minHeight: '320px',
  textAlign: 'center',
});

export const errorText = style({
  color: vars.color.textMuted,
  fontSize: '14px',
});

export const fallbackLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `10px ${vars.space.lg}`,
  border: vars.border.accent,
  color: vars.color.accentHover,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  transition: 'background 200ms ease, color 200ms ease',
  selectors: {
    '&:hover': {
      background: vars.color.accent,
      color: '#ffffff',
    },
  },
});
