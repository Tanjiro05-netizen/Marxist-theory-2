import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const shell = style({
  minHeight: '100vh',
  minWidth: 0,
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
  minWidth: 0,
  paddingTop: 0,
});

export const mainFullBleed = style({
  flex: 1,
  minWidth: 0,
  paddingTop: 0,
});

export const fab = style({
  position: 'fixed',
  bottom: vars.space.lg,
  right: vars.space.lg,
  zIndex: 50,
  textDecoration: 'none',
  '@media': {
    'screen and (max-width: 768px)': {
      bottom: 'max(16px, env(safe-area-inset-bottom))',
      right: 'max(12px, env(safe-area-inset-right))',
    },
  },
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
  transition: 'border-color var(--dur-element) var(--ease-standard), background var(--dur-element) var(--ease-standard)',
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
  transition: 'opacity var(--dur-micro) var(--ease-standard)',
  selectors: {
    [`${fab}:hover &`]: {
      opacity: 1,
    },
  },
});

export const fabAccent = style({
  color: vars.color.accentHover,
});
