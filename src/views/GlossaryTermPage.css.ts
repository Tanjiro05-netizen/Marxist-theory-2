import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({
  minHeight: '100vh',
  background: vars.color.background,
  color: vars.color.text,
});

export const main = style({
  maxWidth: '720px',
  margin: '0 auto',
  padding: `${vars.space.xxl} ${vars.space.md} ${vars.space.hero}`,
});

export const topRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: vars.space.xl,
});

export const backLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  color: vars.color.textMuted,
  fontFamily: vars.font.mono,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  transition: 'color 200ms ease',
  selectors: { '&:hover': { color: vars.color.accent } },
});

export const typeBadge = style({
  display: 'inline-block',
  padding: `2px ${vars.space.sm}`,
  borderRadius: vars.radius.pill,
  background: vars.color.accentWash,
  border: `1px solid ${vars.color.borderAccent}`,
  fontFamily: vars.font.mono,
  fontSize: '10px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: vars.color.accent,
  flexShrink: 0,
});

export const termTitle = style({
  fontFamily: vars.font.display,
  fontSize: '42px',
  fontWeight: 500,
  lineHeight: 1.1,
  letterSpacing: '-0.03em',
  color: vars.color.text,
  marginBottom: vars.space.lg,
});

export const divider = style({
  height: '1px',
  background: `linear-gradient(90deg, ${vars.color.borderAccent}, transparent)`,
  marginBottom: vars.space.lg,
  border: 'none',
});

export const explanation = style({
  fontSize: '16px',
  lineHeight: 1.8,
  fontWeight: 300,
  color: vars.color.textSoft,
  fontFamily: vars.font.body,
});

export const relatedSection = style({
  marginTop: vars.space.xxl,
});

export const relatedHeading = style({
  fontFamily: vars.font.mono,
  fontSize: '10px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  marginBottom: vars.space.md,
});

export const relatedList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.xs,
});

export const relatedChip = style({
  display: 'inline-block',
  padding: `${vars.space.xxs} ${vars.space.sm}`,
  borderRadius: vars.radius.pill,
  background: vars.color.surface,
  border: vars.border.subtle,
  fontFamily: vars.font.body,
  fontSize: '13px',
  color: vars.color.textSoft,
  textDecoration: 'none',
  transition: 'all 180ms ease',
  selectors: {
    '&:hover': {
      borderColor: vars.color.borderAccent,
      color: vars.color.accent,
      background: vars.color.accentWash,
    },
  },
});

export const loadingWrap = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '300px',
  color: vars.color.textMuted,
  fontFamily: vars.font.mono,
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

export const notFound = style({
  textAlign: 'center',
  padding: vars.space.hero,
  color: vars.color.textMuted,
  fontFamily: vars.font.display,
  fontSize: '24px',
});
