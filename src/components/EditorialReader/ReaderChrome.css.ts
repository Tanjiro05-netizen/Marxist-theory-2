import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { vars } from '../../styles/obsidianTheme.css.ts';

const readerTocSlideUp = keyframes({
  from: { transform: 'translateY(100%)' },
  to: { transform: 'translateY(0)' },
});

/* ── Shared reading chrome ──
   The mobile TOC button + bottom sheet shared by EditorialReader and
   TextEditionReader, plus the toolbar's hide-on-scroll modifier. */

globalStyle('body.reader-toc-open', { overflow: 'hidden' });

/* Toolbar slides out of the way while the reader is deep in the text
   (mobile only — desktop keeps the toolbar pinned). The transition lives
   on the toolbar itself; see EditorialReader.css.ts. */
export const toolbarHidden = style({});

globalStyle(`.${toolbarHidden}`, {
  '@media': {
    'screen and (max-width: 780px)': {
      transform: 'translateY(-110%)',
    },
  },
});

/* Contents button — mobile only; the desktop rail is always visible. */
export const tocBtn = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  flexShrink: 0,
  border: vars.border.subtle,
  background: 'transparent',
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'color 160ms ease, border-color 160ms ease',
  selectors: {
    '&:hover': { color: vars.color.accentHover, borderColor: vars.color.accentHover },
  },
  '@media': {
    'screen and (min-width: 1024px)': { display: 'none' },
  },
});

/* Compact percent-read readout for the toolbar. */
export const progressPct = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.12em',
  color: vars.color.textFaint,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  minWidth: '34px',
  textAlign: 'right',
});

/* ── Contents sheet (mobile) ── */

export const tocOverlay = style({
  position: 'fixed',
  inset: 0,
  background: 'rgba(6, 5, 4, 0.72)',
  zIndex: 90,
});

export const tocSheet = style({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  maxHeight: '78vh',
  maxHeight: '78dvh',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.surface,
  borderTop: vars.border.strong,
  borderTopLeftRadius: '18px',
  borderTopRightRadius: '18px',
  boxShadow: vars.shadow.panel,
  zIndex: 91,
  overscrollBehavior: 'contain',
  animation: `${readerTocSlideUp} 260ms cubic-bezier(0.32, 0.72, 0, 1)`,
});

export const tocHandle = style({
  width: '36px',
  height: '4px',
  borderRadius: '4px',
  margin: '12px auto 10px',
  flex: 'none',
  background: vars.color.borderStrong,
});

export const tocHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 20px 12px',
  borderBottom: vars.border.strong,
  marginBottom: '10px',
  flex: 'none',
});

export const tocTitle = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '19px',
  fontWeight: 600,
  color: vars.color.text,
});

export const tocClose = style({
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: vars.border.strong,
  background: 'transparent',
  color: vars.color.textMuted,
  cursor: 'pointer',
});

export const tocList = style({
  padding: '0 20px 20px',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  flex: 1,
  minHeight: 0,
  WebkitOverflowScrolling: 'touch',
  paddingBottom: '20px',
  paddingBottom: 'max(20px, env(safe-area-inset-bottom, 0px))',
});

export const tocItem = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '10px',
  width: '100%',
  minHeight: '44px',
  padding: '11px 4px',
  background: 'transparent',
  border: 'none',
  borderTop: `1px solid ${vars.color.border}`,
  fontFamily: vars.font.body,
  fontSize: '14px',
  lineHeight: 1.4,
  color: vars.color.textMuted,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'color 140ms ease',
  selectors: {
    '&:hover': { color: vars.color.text },
  },
});

export const tocItemActive = style({
  color: vars.color.text,
});

export const tocEmpty = style({
  padding: '16px 4px',
  fontFamily: vars.font.body,
  fontSize: '13px',
  color: vars.color.textFaint,
});
