import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({
  minHeight: '100vh',
  background: vars.color.background,
  color: vars.color.text,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const inner = style({
  maxWidth: '520px',
  margin: '0 auto',
  padding: `${vars.space.hero} ${vars.space.md}`,
  textAlign: 'center',
});

export const iconWrap = style({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: vars.space.lg,
  color: vars.color.accent,
});

export const title = style({
  fontFamily: vars.font.display,
  fontSize: '40px',
  fontWeight: 500,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  color: vars.color.accent,
  marginBottom: vars.space.md,
});

export const rule = style({
  width: '96px',
  height: '1px',
  background: vars.color.accent,
  margin: `0 auto ${vars.space.xl}`,
});

export const subtitle = style({
  fontSize: '16px',
  lineHeight: 1.7,
  color: vars.color.textSoft,
  marginBottom: vars.space.xl,
});

export const highlight = style({
  color: vars.color.text,
  fontWeight: 500,
});

export const card = style({
  background: vars.color.surface,
  border: vars.border.subtle,
  borderRadius: vars.radius.xl,
  padding: vars.space.lg,
  marginBottom: vars.space.xl,
  textAlign: 'center',
});

export const cardTitle = style({
  fontFamily: vars.font.display,
  fontSize: '20px',
  fontWeight: 500,
  marginBottom: vars.space.md,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
});

export const cardTitleIcon = style({
  color: vars.color.warning,
});

export const successMsg = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  color: vars.color.success,
  padding: `${vars.space.md} 0`,
});

export const loginPrompt = style({
  display: 'grid',
  gap: vars.space.md,
  color: vars.color.textSoft,
  fontSize: '14px',
  lineHeight: 1.6,
});

export const loginLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  padding: vars.space.sm,
  background: vars.color.accent,
  color: vars.color.text,
  borderRadius: vars.radius.md,
  fontWeight: 600,
  fontSize: '14px',
  transition: 'background 180ms ease',
  selectors: {
    '&:hover': {
      background: vars.color.accentHover,
    },
  },
});

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
});

export const input = style({
  width: '100%',
  padding: vars.space.sm,
  background: vars.color.surfaceSoft,
  border: vars.border.subtle,
  borderRadius: vars.radius.md,
  color: vars.color.text,
  fontFamily: vars.font.label,
  fontSize: '16px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  textAlign: 'center',
  outline: 'none',
  transition: 'border-color 180ms ease',
  selectors: {
    '&:focus': {
      borderColor: vars.color.warning,
    },
    '&::placeholder': {
      color: vars.color.textFaint,
      textTransform: 'uppercase',
    },
  },
});

export const errorMsg = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  color: vars.color.accent,
  fontSize: '13px',
});

export const submitBtn = style({
  width: '100%',
  padding: vars.space.sm,
  background: vars.color.accent,
  color: vars.color.text,
  borderRadius: vars.radius.md,
  border: 'none',
  fontWeight: 600,
  fontSize: '14px',
  fontFamily: vars.font.body,
  cursor: 'pointer',
  transition: 'background 180ms ease, opacity 180ms ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  selectors: {
    '&:hover:not(:disabled)': {
      background: vars.color.accentHover,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
});

export const backBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.lg}`,
  background: 'transparent',
  color: vars.color.textMuted,
  border: 'none',
  fontSize: '14px',
  fontFamily: vars.font.body,
  cursor: 'pointer',
  transition: 'color 180ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
});
