import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: 'calc(100vh - 4rem)', background: vars.color.background, color: vars.color.text });
export const inner = style({
  maxWidth: '1240px',
  margin: '0 auto',
  padding: `${vars.space.lg} ${vars.space.md}`,
  '@media': {
    'screen and (max-width: 780px)': { padding: `${vars.space.sm} ${vars.space.sm} ${vars.space.lg}` },
  },
});

export const backLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  minHeight: '44px',
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
  marginBottom: vars.space.xs,
  textDecoration: 'none',
  transition: 'color var(--dur-micro) var(--ease-standard)',
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
  '@media': {
    'screen and (max-width: 780px)': { gap: vars.space.sm, padding: `${vars.space.xs} 0 ${vars.space.lg}` },
  },
});

export const coverFrame = style({
  padding: '8px',
  background: vars.color.surface,
  border: vars.border.strong,
  marginBottom: vars.space.sm,
});

export const coverImg = style({
  display: 'block',
  maxHeight: '340px',
  width: 'auto',
  maxWidth: '100%',
  '@media': {
    'screen and (max-width: 780px)': { maxHeight: '220px' },
  },
});
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
export const progressFill = style({ height: '100%', background: vars.color.accent, transition: 'width 0.4s var(--ease-standard)' });

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
  transition: 'transform var(--dur-element) var(--ease-standard)',
};

export const viewTab = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '44px',
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
  transition: 'color var(--dur-micro) var(--ease-standard)',
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
  minHeight: '44px',
  padding: `10px ${vars.space.md}`,
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
  transition: 'color var(--dur-micro) var(--ease-standard), border-color var(--dur-micro) var(--ease-standard)',
  selectors: {
    '&:hover': { color: vars.color.accentHover, borderColor: vars.color.accentHover },
  },
});

/* ── Reader surfaces ── */

export const readerSection = style({ display: 'flex', flexDirection: 'column' });

export const iframeWrap = style({
  height: 'calc(100vh - 170px)',
  minHeight: '560px',
  background: vars.color.surface,
  border: vars.border.subtle,
});
export const iframe = style({ width: '100%', height: '100%', border: 'none' });

export const noPdfWrap = style({ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${vars.space.lg}` });
export const noPdfBox = style({ display: 'flex', alignItems: 'center', gap: vars.space.xs, background: 'rgba(200,134,10,0.12)', color: vars.color.warning, padding: vars.space.md, border: '1px solid rgba(200,134,10,0.25)' });

export const reviewSection = style({ marginTop: vars.space.xxl });

/* ── Suggested reading — the shelf at the foot of the book ── */

export const suggested = style({
  marginTop: vars.space.xxl,
  paddingTop: vars.space.xl,
  borderTop: `1px solid ${vars.color.border}`,
});

export const suggestedTitle = style({
  margin: `0 0 ${vars.space.lg}`,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: vars.color.accentHover,
});

export const suggestedGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: vars.space.lg,
  '@media': {
    'screen and (max-width: 900px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    'screen and (max-width: 480px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
});

export const suggestedCard = style({
  display: 'flex',
  flexDirection: 'column',
  textDecoration: 'none',
  minWidth: 0,
});

export const suggestedCover = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  aspectRatio: '2 / 3',
  marginBottom: vars.space.sm,
  border: `1px solid ${vars.color.borderStrong}`,
  background: vars.color.surface,
  overflow: 'hidden',
  transition: 'border-color var(--dur-micro) var(--ease-standard), box-shadow var(--dur-micro) var(--ease-standard)',
  selectors: {
    [`${suggestedCard}:hover &`]: {
      borderColor: 'rgba(155, 16, 34, 0.55)',
      boxShadow: '0 0 28px rgba(155, 16, 34, 0.22)',
    },
  },
});

export const suggestedCoverImg = style({ width: '100%', height: '100%', objectFit: 'cover', display: 'block' });

export const suggestedCoverIcon = style({ color: vars.color.textFaint });

export const suggestedBookTitle = style({
  margin: `0 0 ${vars.space.xxs}`,
  fontFamily: vars.font.display,
  fontSize: '17px',
  fontWeight: 500,
  lineHeight: 1.3,
  color: vars.color.text,
  transition: 'color var(--dur-micro) var(--ease-standard)',
  selectors: {
    [`${suggestedCard}:hover &`]: { color: vars.color.accentHover },
  },
});

export const suggestedMeta = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
});
