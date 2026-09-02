import { style } from '@vanilla-extract/css';
import { panelInset, vars } from './studyTheme.css.ts';

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: vars.space.lg,
  '@media': {
    'screen and (max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const card = style([panelInset, {
  position: 'relative',
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  minHeight: '250px',
  overflow: 'hidden',
  transition: 'transform 180ms ease, border-color 180ms ease, background 180ms ease',
  selectors: {
    '&:hover': {
      transform: 'translateY(-3px)',
      borderColor: vars.color.borderAccent,
      background: vars.color.surfaceRaised,
    },
  },
}]);

export const glow = style({
  position: 'absolute',
  top: '-30px',
  right: '-30px',
  width: '140px',
  height: '140px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(179, 18, 46,0.14) 0%, rgba(179, 18, 46,0.02) 72%)',
  filter: 'blur(12px)',
  pointerEvents: 'none',
});

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  alignItems: 'flex-start',
});

export const iconShell = style({
  width: '52px',
  height: '52px',
  borderRadius: vars.radius.lg,
  border: vars.border.accent,
  background: vars.color.accentWash,
  color: vars.color.accent,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: vars.shadow.glow,
});

export const termBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xxs,
});

export const term = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '30px',
  lineHeight: 1,
  color: vars.color.text,
});

export const translated = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '16px',
  fontStyle: 'italic',
  color: vars.color.accent,
});

export const explanation = style({
  margin: 0,
  paddingTop: vars.space.md,
  borderTop: vars.border.subtle,
  fontSize: '14px',
  lineHeight: 1.85,
  fontWeight: 300,
  color: vars.color.textMuted,
});
