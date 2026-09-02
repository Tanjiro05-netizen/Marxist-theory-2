import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: 'calc(100vh - 4rem)', background: vars.color.background, color: vars.color.text });
export const inner = style({ maxWidth: '1240px', margin: '0 auto', padding: `${vars.space.lg} ${vars.space.md}` });

export const backLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
  marginBottom: vars.space.lg,
  textDecoration: 'none',
  transition: 'color 140ms ease',
  selectors: { '&:hover': { color: vars.color.accentHover } },
});

export const loadingWrap = style({ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' });
export const loadingInner = style({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: vars.space.sm });
export const loadingText = style({ fontFamily: vars.font.label, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: vars.color.textMuted });
export const errorWrap = style({ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' });
export const errorBox = style({ display: 'flex', alignItems: 'center', gap: vars.space.xs, background: vars.color.accentWash, color: vars.color.accentHover, padding: vars.space.md, border: vars.border.accent });

/* ── Title page ── */

export const titlePage = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: vars.space.md,
  padding: `${vars.space.lg} 0 ${vars.space.xxl}`,
});

export const coverFrame = style({
  padding: '8px',
  background: vars.color.surface,
  border: vars.border.strong,
  marginBottom: vars.space.sm,
});

export const coverImg = style({ display: 'block', maxHeight: '340px', width: 'auto', maxWidth: '100%' });
export const coverFallback = style({
  width: '220px',
  height: '300px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  background: vars.color.surface,
  border: vars.border.strong,
});
export const coverFallbackIcon = style({ color: vars.color.accent, opacity: 0.75 });
export const coverFallbackText = style({ fontFamily: vars.font.display, fontSize: '16px', color: vars.color.textSoft, lineHeight: 1.4, padding: `0 ${vars.space.sm}` });

export const kicker = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.32em',
  color: vars.color.accentHover,
});

export const title = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: 'clamp(36px, 5vw, 56px)',
  fontWeight: 500,
  lineHeight: 1.05,
  letterSpacing: '0.01em',
  color: vars.color.text,
  textWrap: 'balance',
});

export const rule = style({ width: '44px', height: '2px', background: vars.color.accent });

export const metaLine = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  fontVariantNumeric: 'tabular-nums',
});

export const standfirst = style({
  margin: 0,
  maxWidth: '620px',
  fontFamily: vars.font.body,
  fontStyle: 'italic',
  fontSize: '16px',
  lineHeight: 1.8,
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const progressRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  width: 'min(360px, 100%)',
});

export const progressLabel = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
});

export const progressTrack = style({ flex: 1, height: '2px', background: vars.color.surfaceSoft, overflow: 'hidden' });
export const progressFill = style({ height: '100%', background: vars.color.accent, transition: 'width 0.4s ease' });

/* ── Toolbar: view toggle + actions ── */

export const toolbar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  borderTop: vars.border.subtle,
  borderBottom: vars.border.subtle,
  padding: `${vars.space.xs} 0`,
  marginBottom: vars.space.xl,
});

export const viewTabs = style({ display: 'flex', alignItems: 'stretch', gap: vars.space.lg });

const tabUnderline = {
  content: '""',
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '2px',
  background: vars.color.accent,
  transform: 'scaleX(0)',
  transformOrigin: 'left center',
  transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
};

export const viewTab = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${vars.space.sm} 2px`,
  background: 'transparent',
  border: 'none',
  fontFamily: vars.font.label,
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'color 160ms ease',
  selectors: {
    '&::after': tabUnderline,
    '&:hover': { color: vars.color.text },
    '&:hover::after': { transform: 'scaleX(1)' },
  },
});

export const viewTabActive = style({
  color: vars.color.accentHover,
  selectors: {
    '&::after': { ...tabUnderline, transform: 'scaleX(1)' },
  },
});

export const actions = style({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: vars.space.sm });

export const toolBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `9px ${vars.space.md}`,
  background: 'transparent',
  border: vars.border.strong,
  color: vars.color.textSoft,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'color 160ms ease, border-color 160ms ease',
  selectors: {
    '&:hover': { color: vars.color.accentHover, borderColor: vars.color.accentHover },
  },
});

/* ── Reader surfaces ── */

export const readerSection = style({ display: 'flex', flexDirection: 'column' });

export const iframeWrap = style({
  height: 'calc(100vh - 170px)',
  minHeight: '560px',
  background: '#08090d',
  border: vars.border.subtle,
});
export const iframe = style({ width: '100%', height: '100%', border: 'none' });

export const noPdfWrap = style({ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${vars.space.lg}` });
export const noPdfBox = style({ display: 'flex', alignItems: 'center', gap: vars.space.xs, background: 'rgba(200,134,10,0.12)', color: vars.color.warning, padding: vars.space.md, border: '1px solid rgba(200,134,10,0.25)' });

export const reviewSection = style({ marginTop: vars.space.xxl });
