import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const loadingWrap = style({ paddingTop: vars.space.xl, textAlign: 'center', color: vars.color.textMuted });
export const notFoundWrap = style({ paddingTop: vars.space.xl, textAlign: 'center' });
export const notFoundText = style({ color: vars.color.textMuted, fontSize: '16px' });
export const notFoundLink = style({ color: vars.color.accent, marginTop: vars.space.md, display: 'inline-block' });

/* ── Reader toolbar — the only sticky chrome on textbook routes (the site
   navband scrolls away there). Slides out of the way while the reader is
   scrolled into the text on phones (ReaderChrome's hide-on-scroll). ── */

export const toolbar = style({
  position: 'sticky',
  top: 0,
  zIndex: 30,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  padding: `${vars.space.xs} 0`,
  background: vars.color.background,
  borderBottom: `1px solid ${vars.color.borderStrong}`,
  '@media': {
    'screen and (max-width: 780px)': {
      transition: 'transform 240ms ease',
    },
  },
});

export const titleGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  minWidth: 0,
  flex: '1 1 100%',
  '@media': {
    'screen and (min-width: 781px)': { flex: '1 1 auto' },
  },
});

export const backBtn = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  flex: 'none',
  border: vars.border.subtle,
  background: 'transparent',
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'color 160ms ease, border-color 160ms ease',
  selectors: {
    '&:hover': { color: vars.color.accentHover, borderColor: vars.color.accentHover },
  },
});

export const titleBlock = style({ minWidth: 0 });

export const title = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '17px',
  fontWeight: 600,
  lineHeight: 1.25,
  color: vars.color.text,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '@media': {
    'screen and (min-width: 781px)': { fontSize: '19px' },
  },
});

export const author = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const controls = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  flexWrap: 'wrap',
});

export const pageGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  marginRight: vars.space.xs,
  paddingRight: vars.space.sm,
  borderRight: `1px solid ${vars.color.borderStrong}`,
});

export const ctrlBtn = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  flex: 'none',
  border: vars.border.subtle,
  background: 'transparent',
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'color 160ms ease, border-color 160ms ease',
  selectors: {
    '&:hover': { color: vars.color.accentHover, borderColor: vars.color.accentHover },
    '&:disabled': { opacity: 0.35, cursor: 'default', pointerEvents: 'none' },
  },
});

export const pageValue = style({
  fontFamily: vars.font.label,
  fontSize: '10.5px',
  letterSpacing: '0.06em',
  color: vars.color.textMuted,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  minWidth: '72px',
  textAlign: 'center',
});

export const zoomValue = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.1em',
  color: vars.color.textFaint,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  minWidth: '40px',
  textAlign: 'center',
});

/* ── Viewer ── */

export const viewer = style({
  padding: `${vars.space.md} ${vars.space.sm} ${vars.space.lg}`,
});

export const frameMax = style({
  maxWidth: '920px',
  margin: '0 auto',
});

export const frame = style({
  background: '#ffffff',
  overflowX: 'auto',
  overflowY: 'hidden',
  border: vars.border.strong,
});

export const pdfFrame = style({
  display: 'block',
  width: '100%',
  height: 'calc(100dvh - 120px)',
  minHeight: '480px',
  border: 'none',
});

export const emptyWrap = style({
  padding: `${vars.space.xxl} ${vars.space.md}`,
  textAlign: 'center',
  color: vars.color.textMuted,
});

/* ── About card — in flow below the PDF, never floating over the text ── */

export const about = style({
  maxWidth: '640px',
  margin: `${vars.space.xl} auto 0`,
  padding: vars.space.md,
  background: vars.color.surface,
  border: vars.border.strong,
});

export const aboutTitle = style({
  margin: `0 0 ${vars.space.xs}`,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: vars.color.accentHover,
});

export const aboutText = style({
  margin: 0,
  fontFamily: vars.font.body,
  fontSize: '13.5px',
  lineHeight: 1.7,
  color: vars.color.textMuted,
});
