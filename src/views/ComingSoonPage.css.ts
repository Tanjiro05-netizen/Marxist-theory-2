import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({
  minHeight: '100vh',
  background: vars.color.background,
  color: vars.color.text,
});

export const inner = style({
  maxWidth: '680px',
  margin: '0 auto',
  padding: `${vars.space.hero} ${vars.space.md}`,
  textAlign: 'center',
});

export const title = style({
  fontFamily: vars.font.display,
  fontSize: '56px',
  fontWeight: 500,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  color: vars.color.accent,
  marginBottom: vars.space.md,
  '@media': {
    'screen and (max-width: 640px)': {
      fontSize: '36px',
    },
  },
});

export const rule = style({
  width: '96px',
  height: '1px',
  background: vars.color.accent,
  margin: `0 auto ${vars.space.xl}`,
});

export const subtitle = style({
  fontSize: '20px',
  lineHeight: 1.6,
  fontWeight: 300,
  color: vars.color.textSoft,
  marginBottom: vars.space.xl,
});

export const card = style({
  background: vars.color.surface,
  border: vars.border.subtle,
  borderRadius: vars.radius.xl,
  padding: vars.space.xl,
  marginBottom: vars.space.xxl,
  textAlign: 'left',
});

export const cardTitle = style({
  fontFamily: vars.font.display,
  fontSize: '24px',
  fontWeight: 500,
  letterSpacing: '-0.02em',
  marginBottom: vars.space.md,
});

export const cardText = style({
  fontSize: '14px',
  lineHeight: 1.8,
  color: vars.color.textMuted,
  marginBottom: vars.space.md,
  selectors: {
    '&:last-child': {
      marginBottom: 0,
    },
  },
});

export const backButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.lg}`,
  background: vars.color.accent,
  color: vars.color.text,
  borderRadius: vars.radius.pill,
  border: 'none',
  fontSize: '14px',
  fontWeight: 500,
  fontFamily: vars.font.body,
  cursor: 'pointer',
  transition: 'background 180ms ease',
  selectors: {
    '&:hover': {
      background: vars.color.accentHover,
    },
  },
});

export const featureIconFrame = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '64px',
  height: '64px',
  borderRadius: vars.radius.lg,
  background: vars.color.accentWash,
  color: vars.color.accent,
  margin: `0 auto ${vars.space.lg}`,
});

export const featureDesc = style({
  fontSize: '16px',
  lineHeight: 1.7,
  fontWeight: 300,
  color: vars.color.textMuted,
  marginBottom: vars.space.xl,
});

export const registerCta = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.xl}`,
  background: vars.color.accent,
  color: vars.color.text,
  borderRadius: vars.radius.pill,
  border: 'none',
  fontSize: '15px',
  fontWeight: 500,
  fontFamily: vars.font.body,
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'background 180ms ease',
  marginBottom: vars.space.xxl,
  selectors: {
    '&:hover': {
      background: vars.color.accentHover,
    },
  },
});

export const teaserSection = style({
  marginTop: vars.space.xl,
  marginBottom: vars.space.xl,
});

export const teaserGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: vars.space.lg,
  '@media': {
    'screen and (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const teaserCard = style({
  position: 'relative',
  background: vars.color.surface,
  border: vars.border.subtle,
  borderRadius: vars.radius.xl,
  padding: vars.space.lg,
  overflow: 'hidden',
});

export const teaserLabel = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  marginBottom: vars.space.sm,
});

export const teaserOverlay = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  background: 'rgba(9,9,9,0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 2,
  borderRadius: vars.radius.xl,
});

export const teaserOverlayText = style({
  fontSize: '14px',
  fontWeight: 500,
  color: vars.color.textSoft,
});

export const teaserOverlayCta = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.xs} ${vars.space.lg}`,
  background: vars.color.accent,
  color: vars.color.text,
  borderRadius: vars.radius.pill,
  fontSize: '13px',
  fontWeight: 500,
  fontFamily: vars.font.body,
  textDecoration: 'none',
  transition: 'background 180ms ease',
  selectors: {
    '&:hover': {
      background: vars.color.accentHover,
    },
  },
});
