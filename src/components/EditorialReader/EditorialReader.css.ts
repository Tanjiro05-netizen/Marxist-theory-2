import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from '../../styles/obsidianTheme.css.ts';

export const root = style({
  display: 'grid',
  gridTemplateColumns: '260px minmax(0, 1fr)',
  gap: vars.space.xxl,
  alignItems: 'start',
  '@media': {
    'screen and (max-width: 1023px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
});

/* Grid tracks bottom out at min-content unless the children are allowed to
   shrink — without this the reading column forces page overflow. */
globalStyle(`${root} > *`, { minWidth: 0 });

/* ── Chapter rail ── */

export const rail = style({
  position: 'sticky',
  top: '64px',
  maxHeight: 'calc(100vh - 88px)',
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
  transition: 'color var(--dur-micro) var(--ease-standard), border-color var(--dur-micro) var(--ease-standard)',
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

/* ── Reading stage — the window itself is the scroller; nothing contains
   the text. The book flows in the page like an article. ── */

export const shell = style({
  position: 'relative',
});

export const progressTrack = style({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  zIndex: 70,
  height: '3px',
  background: 'transparent',
  pointerEvents: 'none',
});

export const progressFill = style({
  height: '100%',
  background: vars.color.accent,
  transition: 'width var(--dur-element) var(--ease-standard)',
});

/* The reading toolbar is the only sticky chrome on /book/* — the site
   navband scrolls away there, so this pins to the viewport top. On mobile
   it also slides away while scrolling into the text (see ReaderChrome). */
export const toolbar = style({
  position: 'sticky',
  top: 0,
  zIndex: 30,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  padding: `${vars.space.sm} 0`,
  background: vars.color.background,
  borderBottom: `1px solid ${vars.color.borderStrong}`,
  marginBottom: vars.space.xl,
  '@media': {
    'screen and (max-width: 780px)': {
      transition: 'transform var(--dur-element) var(--ease-standard)',
    },
  },
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
  flex: '1 1 auto',
  minWidth: 0,
  '@media': {
    'screen and (max-width: 780px)': { fontSize: '13px' },
  },
});

export const chapterIndex = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  color: vars.color.textFaint,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  '@media': {
    /* The counter also lives in the contents sheet — drop it here so the
       toolbar keeps one row on phones. */
    'screen and (max-width: 780px)': { display: 'none' },
  },
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
  width: '44px',
  height: '44px',
  background: 'transparent',
  border: vars.border.subtle,
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'color var(--dur-micro) var(--ease-standard), border-color var(--dur-micro) var(--ease-standard)',
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
  transition: 'background var(--dur-micro) var(--ease-standard), color var(--dur-micro) var(--ease-standard)',
  selectors: {
    '&:hover': {
      background: vars.color.accent,
      color: '#ffffff',
    },
  },
});
