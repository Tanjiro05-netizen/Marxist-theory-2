import { style, keyframes } from '@vanilla-extract/css';
import { vars } from '../../styles/obsidianTheme.css.ts';

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

export const globeContainer = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: '600px',
  background: 'radial-gradient(ellipse at center, #0b0d12 0%, #08090d 100%)',
  borderRadius: vars.radius.xl,
  overflow: 'hidden',
  border: vars.border.subtle,
});

export const canvasWrap = style({
  position: 'absolute',
  inset: 0,
});

export const overlay = style({
  position: 'absolute',
  top: vars.space.lg,
  left: vars.space.lg,
  zIndex: 10,
  pointerEvents: 'none',
  animation: `${fadeIn} 800ms ease both`,
});

export const overlayTitle = style({
  fontFamily: vars.font.display,
  fontSize: '22px',
  fontWeight: 500,
  letterSpacing: '-0.02em',
  color: vars.color.text,
  marginBottom: vars.space.xxs,
});

export const overlaySubtitle = style({
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
});

export const controls = style({
  position: 'absolute',
  bottom: vars.space.lg,
  right: vars.space.lg,
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  animation: `${fadeIn} 800ms ease 200ms both`,
});

export const controlBtn = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: vars.radius.md,
  background: 'rgba(9,9,9,0.72)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: vars.border.subtle,
  color: vars.color.textSoft,
  cursor: 'pointer',
  transition: 'all 180ms ease',
  selectors: {
    '&:hover': {
      background: 'rgba(20,20,28,0.85)',
      color: vars.color.text,
      borderColor: vars.color.borderAccent,
    },
  },
});

export const controlBtnActive = style({
  background: vars.color.accentWash,
  color: vars.color.accent,
  borderColor: vars.color.borderAccent,
});

export const loadingWrap = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.md,
  zIndex: 5,
  background: 'radial-gradient(ellipse at center, #0b0d12 0%, #08090d 100%)',
});

export const spinner = style({
  width: '32px',
  height: '32px',
  border: '2px solid rgba(179, 18, 46,0.2)',
  borderTopColor: vars.color.accent,
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
});

export const loadingText = style({
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
});

export const hint = style({
  position: 'absolute',
  bottom: vars.space.lg,
  left: vars.space.lg,
  zIndex: 10,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.06em',
  color: vars.color.textFaint,
  animation: `${fadeIn} 800ms ease 400ms both`,
});

/* ── Legend / category filter ── */

export const legend = style({
  position: 'absolute',
  top: vars.space.md,
  right: vars.space.md,
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xxs,
  animation: `${fadeIn} 800ms ease 200ms both`,
});

export const legendItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.xxs} ${vars.space.sm}`,
  borderRadius: vars.radius.pill,
  background: 'rgba(9,9,9,0.72)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: vars.border.subtle,
  color: vars.color.textSoft,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 180ms ease',
  selectors: {
    '&:hover': {
      borderColor: vars.color.borderStrong,
      color: vars.color.text,
    },
  },
});

export const legendItemDisabled = style({
  opacity: 0.35,
});

export const legendDot = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  flexShrink: 0,
});

/* ── Event info panel ── */

export const infoPanel = style({
  position: 'absolute',
  bottom: vars.space.md,
  left: vars.space.md,
  zIndex: 10,
  maxWidth: '340px',
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  background: 'rgba(9,9,9,0.8)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: vars.border.subtle,
  animation: `${fadeIn} 200ms ease both`,
  pointerEvents: 'none',
});

export const infoCategory = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: vars.space.xxs,
});

export const infoTitle = style({
  fontFamily: vars.font.display,
  fontSize: '18px',
  fontWeight: 500,
  letterSpacing: '-0.01em',
  color: vars.color.text,
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.sm,
  marginBottom: vars.space.xs,
});

export const infoYear = style({
  fontFamily: vars.font.label,
  fontSize: '12px',
  color: vars.color.textMuted,
});

export const infoDesc = style({
  fontSize: '13px',
  lineHeight: 1.6,
  color: vars.color.textSoft,
  margin: 0,
});
