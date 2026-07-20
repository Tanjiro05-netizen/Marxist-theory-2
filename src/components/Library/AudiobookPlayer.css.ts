import { style, keyframes } from '@vanilla-extract/css';
import { panelBase, panelInset, vars } from '../StudyPage/studyTheme.css.ts';

/* ── keyframes ── */
const barBounce = keyframes({
  '0%, 100%': { transform: 'scaleY(0.3)' },
  '50%': { transform: 'scaleY(1)' },
});

const pulse = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.4 },
});

const glowPulse = keyframes({
  '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
  '50%': { opacity: 1, transform: 'scale(1.08)' },
});

/* ── player panel ── */
export const player = style([panelBase, {
  padding: vars.space.xxl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
  borderColor: vars.color.borderAccent,
  boxShadow: `${vars.shadow.panel}, ${vars.shadow.glow}, 0 0 80px rgba(200,30,30,0.06)`,
  background: `linear-gradient(180deg, rgba(25,12,12,1) 0%, ${vars.color.surface} 100%)`,
  marginBottom: vars.space.xxxl,
  '@media': {
    'screen and (max-width: 640px)': {
      padding: vars.space.xl,
    },
  },
}]);

export const playerTop = style({
  display: 'grid',
  gridTemplateColumns: '120px minmax(0, 1fr) auto',
  gap: vars.space.xl,
  alignItems: 'center',
  '@media': {
    'screen and (max-width: 640px)': {
      gridTemplateColumns: '80px minmax(0, 1fr) auto',
      gap: vars.space.md,
    },
  },
});

export const playerCoverWrap = style({
  position: 'relative',
  flexShrink: 0,
});

export const playerCover = style({
  width: '120px',
  height: '120px',
  borderRadius: vars.radius.lg,
  objectFit: 'cover',
  border: vars.border.accent,
  boxShadow: `${vars.shadow.glow}, 0 8px 32px rgba(0,0,0,0.5)`,
  display: 'block',
  position: 'relative',
  zIndex: 1,
  '@media': {
    'screen and (max-width: 640px)': {
      width: '80px',
      height: '80px',
    },
  },
});

export const playerCoverFallback = style({
  width: '120px',
  height: '120px',
  borderRadius: vars.radius.lg,
  border: vars.border.accent,
  background: `linear-gradient(135deg, ${vars.color.surfaceSoft} 0%, rgba(200,30,30,0.12) 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.accent,
  boxShadow: `${vars.shadow.glow}, 0 8px 32px rgba(0,0,0,0.5)`,
  position: 'relative',
  zIndex: 1,
  '@media': {
    'screen and (max-width: 640px)': {
      width: '80px',
      height: '80px',
    },
  },
});

export const playerCoverGlow = style({
  position: 'absolute',
  inset: '-8px',
  borderRadius: vars.radius.xl,
  background: 'radial-gradient(circle, rgba(200,30,30,0.3) 0%, transparent 70%)',
  animation: `${glowPulse} 2s ease-in-out infinite`,
  zIndex: 0,
  pointerEvents: 'none',
});

export const playerInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  minWidth: 0,
});

export const playerNowPlaying = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
});

export const nowPlayingDot = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: vars.color.accent,
  boxShadow: '0 0 8px rgba(200,30,30,0.6)',
  animation: `${pulse} 1.5s ease-in-out infinite`,
});

export const nowPlayingLabel = style({
  fontFamily: vars.font.mono,
  fontSize: '10px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: vars.color.accent,
});

export const playerTitle = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
  lineHeight: 1.05,
  fontWeight: 500,
  letterSpacing: '-0.03em',
  color: vars.color.text,
});

export const playerAuthor = style({
  margin: 0,
  fontSize: '14px',
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const playerClose = style({
  flexShrink: 0,
  width: '40px',
  height: '40px',
  borderRadius: vars.radius.md,
  border: vars.border.subtle,
  background: vars.color.surfaceSoft,
  color: vars.color.textMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'border-color 150ms ease, color 150ms ease, background 150ms ease',
  selectors: {
    '&:hover': {
      borderColor: vars.color.borderAccent,
      color: vars.color.text,
      background: vars.color.accentWash,
    },
  },
});

/* ── canvas visualizer ── */
export const visualizerWrap = style({
  position: 'relative',
  width: '100%',
  height: '100px',
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
  background: 'transparent',
});

export const visualizerCanvas = style({
  width: '100%',
  height: '100%',
  display: 'block',
  opacity: 0.9,
});

export const visualizerFade = style({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '30%',
  background: 'linear-gradient(180deg, transparent 0%, rgba(9,9,9,0.2) 100%)',
  pointerEvents: 'none',
});

/* ── audio controls ── */
export const audioElement = style({
  width: '100%',
  height: '44px',
  borderRadius: vars.radius.md,
  outline: 'none',
});

/* ── chapters ── */
export const chapters = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
});

export const chaptersLabel = style({
  margin: 0,
  fontFamily: vars.font.mono,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.textFaint,
});

export const chaptersList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xxs,
});

export const chapterBtn = style({
  all: 'unset',
  cursor: 'pointer',
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontSize: '13px',
  fontWeight: 300,
  color: vars.color.textMuted,
  borderRadius: vars.radius.md,
  border: vars.border.subtle,
  background: vars.color.surface,
  transition: 'background 180ms ease, color 180ms ease, border-color 180ms ease, transform 180ms ease',
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  selectors: {
    '&:hover': {
      background: vars.color.accentWash,
      borderColor: vars.color.borderAccent,
      color: vars.color.text,
      transform: 'translateX(4px)',
    },
  },
});

export const chapterIndex = style({
  width: '24px',
  height: '24px',
  borderRadius: vars.radius.sm,
  background: vars.color.surfaceSoft,
  border: vars.border.subtle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: vars.font.mono,
  fontSize: '10px',
  color: vars.color.textFaint,
  flexShrink: 0,
});

export const chapterPlay = style({
  marginLeft: 'auto',
  color: vars.color.textFaint,
  flexShrink: 0,
});
