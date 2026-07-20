import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const shell = style({
  minHeight: '100vh',
  background: vars.color.background,
  color: vars.color.text,
  fontFamily: vars.font.body,
});

export const main = style({
  paddingTop: '64px',
});

export const mainFullBleed = style({
  paddingTop: 0,
});

export const fab = style({
  position: 'fixed',
  bottom: vars.space.lg,
  right: vars.space.lg,
  zIndex: 50,
  textDecoration: 'none',
});

export const fabCircle = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: vars.color.surface,
  border: vars.border.accent,
  color: vars.color.accent,
  transition: 'all 240ms ease',
  selectors: {
    '&:hover': {
      borderColor: vars.color.accentHover,
      boxShadow: vars.shadow.glow,
    },
  },
});

export const fabPulse = style({
  position: 'absolute',
  inset: 0,
  borderRadius: '50%',
  border: `1px solid ${vars.color.accentSoft}`,
  animationName: 'ping',
  animationDuration: '2s',
  animationIterationCount: 'infinite',
  animationTimingFunction: 'ease-out',
});

export const fabTooltip = style({
  position: 'absolute',
  bottom: '100%',
  right: 0,
  marginBottom: vars.space.xs,
  padding: `${vars.space.xxs} ${vars.space.xs}`,
  background: vars.color.surface,
  border: vars.border.accent,
  borderRadius: vars.radius.sm,
  fontFamily: vars.font.mono,
  fontSize: '10px',
  color: vars.color.textMuted,
  whiteSpace: 'nowrap',
  opacity: 0,
  transition: 'opacity 180ms ease',
  selectors: {
    [`${fab}:hover &`]: {
      opacity: 1,
    },
  },
});

export const fabAccent = style({
  color: vars.color.accent,
});
