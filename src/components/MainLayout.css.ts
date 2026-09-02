import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const shell = style({
  minHeight: '100vh',
  background: vars.color.background,
  color: vars.color.text,
  fontFamily: vars.font.body,
  display: 'flex',
  flexDirection: 'column',
});

/* The header is in flow (masthead scrolls away, navband is sticky),
   so no fixed-header padding is needed. */
export const main = style({
  flex: 1,
  paddingTop: 0,
});

export const mainFullBleed = style({
  flex: 1,
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
  width: '46px',
  height: '46px',
  borderRadius: vars.radius.tiny,
  background: vars.color.surface,
  border: vars.border.accent,
  color: vars.color.accentHover,
  transition: 'border-color 240ms ease, background 240ms ease',
  selectors: {
    '&:hover': {
      borderColor: vars.color.accentHover,
      background: vars.color.accentWash,
    },
  },
});

export const fabPulse = style({
  display: 'none',
});

export const fabTooltip = style({
  position: 'absolute',
  bottom: '100%',
  right: 0,
  marginBottom: vars.space.xs,
  padding: `${vars.space.xxs} ${vars.space.xs}`,
  background: vars.color.surface,
  border: vars.border.strong,
  borderRadius: vars.radius.tiny,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
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
  color: vars.color.accentHover,
});
