import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const footer = style({
  marginTop: vars.space.hero,
  borderTop: vars.border.subtle,
  background: vars.color.background,
});

export const inner = style({
  maxWidth: vars.layout.maxWidth,
  margin: '0 auto',
  padding: `${vars.space.xxxl} ${vars.space.md}`,
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: vars.space.xxl,
  '@media': {
    'screen and (min-width: 820px)': {
      gridTemplateColumns: '1.2fr 1fr 1.2fr',
      gap: vars.layout.gutter,
    },
  },
});

export const col = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
});

export const wordmark = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '20px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  color: vars.color.text,
});

export const wordmarkDot = style({
  color: vars.color.accentHover,
});

export const rule = style({
  display: 'block',
  width: '26px',
  height: '2px',
  background: vars.color.accent,
  margin: `${vars.space.sm} 0`,
});

export const mission = style({
  margin: 0,
  fontFamily: vars.font.body,
  fontSize: '14px',
  lineHeight: 1.75,
  color: vars.color.textMuted,
  maxWidth: '320px',
});

export const colLabel = style({
  margin: `0 0 ${vars.space.md}`,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.24em',
  color: vars.color.textFaint,
});

export const linkGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: `${vars.space.xs} ${vars.space.xl}`,
});

export const link = style({
  fontFamily: vars.font.body,
  fontSize: '14px',
  color: vars.color.textMuted,
  paddingBottom: '2px',
  transition: 'color 180ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.accentHover,
    },
  },
});

export const epigraph = style({
  margin: 0,
  fontFamily: vars.font.body,
  fontStyle: 'italic',
  fontSize: '15px',
  lineHeight: 1.8,
  color: vars.color.textMuted,
});

export const attribution = style({
  margin: `${vars.space.sm} 0 0`,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  color: '#d8c79f',
});

export const metaRow = style({
  borderTop: vars.border.subtle,
  padding: `${vars.space.md} 0`,
  textAlign: 'center',
});

export const meta = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.24em',
  color: vars.color.textFaint,
});
