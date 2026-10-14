import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

/* Fullscreen reading stage — longform text sits directly on the ink, unboxed.
   The EPUB reader keeps its contained book panels by design; articles and
   dispatches read edge to edge with a bounded typographic measure. */

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const loadingWrap = style({ minHeight: '100vh', background: vars.color.background, display: 'flex', alignItems: 'center', justifyContent: 'center', color: vars.color.text });
export const errorWrap = style({ textAlign: 'center', padding: `${vars.space.hero} ${vars.space.md}` });
export const errorTitle = style({ fontFamily: vars.font.display, fontSize: '24px', fontWeight: 500, marginBottom: vars.space.md });
export const errorText = style({ color: vars.color.textMuted, fontSize: '14px', marginBottom: vars.space.lg });
export const errorLink = style({
  display: 'inline-flex', alignItems: 'center', minHeight: '44px', padding: `0 ${vars.space.lg}`,
  border: `1px solid ${vars.color.borderStrong}`, color: vars.color.text, textDecoration: 'none',
  fontFamily: vars.font.label, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
  transition: 'color 160ms ease, border-color 160ms ease',
  selectors: { '&:hover': { color: vars.color.accentHover, borderColor: vars.color.accentHover } },
});

export const progressTrack = style({ position: 'fixed', top: 0, left: 0, width: '100%', height: '3px', zIndex: 60, background: 'rgba(0, 0, 0, 0.35)' });
export const progressFill = style({ height: '100%', background: vars.color.accent, transition: 'width 150ms linear' });

export const stage = style({ minWidth: 0, padding: `${vars.space.lg} max(24px, env(safe-area-inset-right)) 0 max(24px, env(safe-area-inset-left))` });

export const readerGrid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  maxWidth: '1760px',
  margin: '0 auto',
  '@media': {
    'screen and (min-width: 1100px)': {
      gridTemplateColumns: '230px minmax(0, 1fr) 320px',
      columnGap: vars.space.xxl,
      alignItems: 'start',
    },
  },
});
export const readerGridFocus = style({ display: 'block' });
export const sideRail = style({
  minWidth: 0,
  display: 'none',
  '@media': { 'screen and (min-width: 1100px)': { display: 'block' } },
});
export const readingColumn = style({ minWidth: 0, maxWidth: '76ch', margin: '0 auto', paddingBottom: vars.space.hero });

/* ── Toolbar — one hairline-bounded strip, no boxes beneath it ── */

export const toolbar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  padding: `${vars.space.xxs} 0`,
  borderTop: `1px solid ${vars.color.borderStrong}`,
  borderBottom: `1px solid ${vars.color.borderStrong}`,
  marginBottom: vars.space.lg,
});
export const toolGroup = style({ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: vars.space.xxs });
export const toolButton = style({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '38px', height: '38px',
  background: 'transparent', border: '1px solid transparent', color: vars.color.textSoft,
  cursor: 'pointer', transition: 'color 150ms ease, border-color 150ms ease',
  selectors: {
    '&:hover': { color: vars.color.text, borderColor: vars.color.borderStrong },
    '&:focus-visible': { color: vars.color.text, borderColor: vars.color.accentHover },
    '&:disabled': { opacity: 0.4, cursor: 'default' },
  },
});
export const toolTextButton = style({
  display: 'inline-flex', alignItems: 'center', gap: vars.space.xxs,
  minHeight: '34px', padding: `0 ${vars.space.sm}`,
  background: 'transparent', border: `1px solid ${vars.color.borderStrong}`, color: vars.color.textSoft,
  fontFamily: vars.font.label, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
  cursor: 'pointer', textDecoration: 'none', transition: 'color 150ms ease, border-color 150ms ease',
  selectors: {
    '&:hover': { color: vars.color.accentHover, borderColor: vars.color.accentHover },
    '&:focus-visible': { color: vars.color.accentHover, borderColor: vars.color.accentHover },
  },
});
export const toolButtonOn = style({ color: vars.color.accentHover, borderColor: 'rgba(155, 16, 34, 0.55)' });

export const milestone = style({
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  minHeight: '32px', padding: '0 12px', marginBottom: vars.space.md,
  border: `1px solid ${vars.color.borderStrong}`,
  color: vars.color.textMuted, fontFamily: vars.font.label, fontSize: '10px',
  letterSpacing: '0.12em', textTransform: 'uppercase', fontVariantNumeric: 'tabular-nums',
});
export const milestoneDot = style({ width: '6px', height: '6px', borderRadius: '50%', background: vars.color.accent });

export const searchRow = style({
  display: 'flex', alignItems: 'center', gap: vars.space.sm,
  border: `1px solid ${vars.color.borderStrong}`, padding: '8px 12px', marginBottom: vars.space.md,
});
export const searchInput = style({ flex: 1, minWidth: 0, background: 'transparent', border: 0, color: vars.color.text, fontSize: '15px', outline: 'none' });
export const searchCount = style({ fontFamily: vars.font.label, fontSize: '12px', color: vars.color.textMuted, fontVariantNumeric: 'tabular-nums' });

export const toolPanels = style({ marginBottom: vars.space.lg });

/* ── Title band — the full-bleed newspaper head ── */

export const titleBand = style({
  textAlign: 'center',
  padding: `${vars.space.xxl} 0 ${vars.space.xl}`,
  borderBottom: `1px solid ${vars.color.border}`,
  marginBottom: vars.space.xxl,
});
export const kicker = style({
  margin: `0 0 ${vars.space.sm}`, fontFamily: vars.font.label, fontSize: '10px',
  fontWeight: 500, letterSpacing: '0.32em', textTransform: 'uppercase', color: vars.color.accentHover,
});
export const title = style({
  margin: `0 0 ${vars.space.md}`, fontFamily: vars.font.display,
  fontSize: 'clamp(34px, 4.4vw, 58px)', fontWeight: 500, lineHeight: 1.08,
  color: vars.color.text, textWrap: 'balance',
});
export const titleRule = style({ width: '44px', height: '2px', margin: `0 auto ${vars.space.sm}`, background: vars.color.accent });
export const byline = style({
  margin: 0, fontFamily: vars.font.label, fontSize: '12px',
  letterSpacing: '0.18em', textTransform: 'uppercase', color: vars.color.textMuted,
});

export const proseWrap = style({ marginBottom: vars.space.xxl });

export const toast = style({
  position: 'fixed', bottom: '20px', right: '20px', zIndex: 80,
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '10px 16px', border: `1px solid ${vars.color.borderStrong}`,
  background: vars.color.surface, color: vars.color.text,
  fontFamily: vars.font.label, fontSize: '12px', letterSpacing: '0.08em',
});
