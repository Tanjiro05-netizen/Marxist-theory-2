import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({
  minHeight: '100vh',
  background: vars.color.background,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.text,
  padding: `0 ${vars.space.md}`,
});

export const inner = style({
  textAlign: 'center',
  maxWidth: '420px',
});

export const code = style({
  fontFamily: vars.font.display,
  fontSize: '96px',
  fontWeight: 600,
  lineHeight: 1,
  color: vars.color.accent,
  marginBottom: vars.space.md,
});

export const title = style({
  fontFamily: vars.font.display,
  fontSize: '28px',
  fontWeight: 500,
  letterSpacing: '-0.02em',
  marginBottom: vars.space.md,
});

export const text = style({
  fontSize: '14px',
  lineHeight: 1.7,
  color: vars.color.textMuted,
  marginBottom: vars.space.xl,
});

export const backLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${vars.space.sm} ${vars.space.lg}`,
  background: vars.color.accent,
  color: vars.color.text,
  borderRadius: vars.radius.pill,
  fontSize: '14px',
  fontWeight: 500,
  fontFamily: vars.font.body,
  transition: 'background 180ms ease',
  selectors: {
    '&:hover': {
      background: vars.color.accentHover,
    },
  },
});
