import { style } from '@vanilla-extract/css';
import { vars } from './styles/obsidianTheme.css.ts';

export const page = style({
  minHeight: '100vh',
  background: vars.color.background,
});

/* ── Hero ── */

export const hero = style({
  position: 'relative',
  height: '100vh',
  overflow: 'hidden',
});

export const heroGrid = style({
  position: 'absolute',
  inset: 0,
  backgroundImage: 'radial-gradient(rgba(200,30,30,0.12) 1px, transparent 1px)',
  backgroundSize: '16px 16px',
  opacity: 0.35,
  pointerEvents: 'none',
});

export const heroImageWrap = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
});

export const heroImage = style({
  width: '800px',
  height: '800px',
  objectFit: 'contain',
  opacity: 0.18,
  filter: 'brightness(0.7) contrast(1.2)',
  mixBlendMode: 'soft-light',
});

export const heroContent = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.text,
});

export const heroCopy = style({
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
  maxWidth: '800px',
  padding: `0 ${vars.space.md}`,
});

export const heroTitle = style({
  fontFamily: vars.font.display,
  fontSize: '72px',
  fontWeight: 500,
  letterSpacing: '-0.04em',
  lineHeight: 1,
  color: vars.color.text,
  '@media': {
    'screen and (max-width: 640px)': {
      fontSize: '42px',
    },
  },
});

export const heroSubtitle = style({
  fontSize: '20px',
  lineHeight: 1.6,
  fontWeight: 300,
  color: vars.color.textSoft,
  maxWidth: '600px',
  margin: '0 auto',
  '@media': {
    'screen and (max-width: 640px)': {
      fontSize: '16px',
    },
  },
});

export const heroCtas = style({
  display: 'flex',
  justifyContent: 'center',
  gap: vars.space.md,
  flexWrap: 'wrap',
});

export const ctaPrimary = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${vars.space.sm} ${vars.space.xl}`,
  background: vars.color.accent,
  color: vars.color.text,
  borderRadius: vars.radius.pill,
  fontFamily: vars.font.body,
  fontSize: '15px',
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
  transition: 'background 180ms ease',
  selectors: {
    '&:hover': {
      background: vars.color.accentHover,
    },
  },
});

export const ctaSecondary = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${vars.space.sm} ${vars.space.xl}`,
  background: 'transparent',
  color: vars.color.text,
  borderRadius: vars.radius.pill,
  fontFamily: vars.font.body,
  fontSize: '15px',
  fontWeight: 500,
  border: vars.border.strong,
  cursor: 'pointer',
  transition: 'all 180ms ease',
  selectors: {
    '&:hover': {
      background: vars.color.text,
      color: vars.color.background,
    },
  },
});

/* ── About ── */

export const aboutSection = style({
  padding: `${vars.space.hero} 0`,
  background: 'rgba(0,0,0,0.3)',
});

export const aboutInner = style({
  maxWidth: '800px',
  margin: '0 auto',
  padding: `0 ${vars.space.md}`,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
});

export const aboutTitle = style({
  fontFamily: vars.font.display,
  fontSize: '36px',
  fontWeight: 500,
  letterSpacing: '-0.02em',
  color: vars.color.text,
});

export const aboutText = style({
  fontSize: '16px',
  lineHeight: 1.7,
  fontWeight: 300,
  color: vars.color.textSoft,
});

export const aboutGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: vars.space.xl,
  paddingTop: vars.space.lg,
  textAlign: 'left',
  '@media': {
    'screen and (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const aboutCard = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.md,
});

export const aboutIconFrame = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: vars.radius.md,
  background: vars.color.accentWash,
  flexShrink: 0,
  color: vars.color.accent,
});

export const aboutCardTitle = style({
  fontWeight: 600,
  color: vars.color.text,
  marginBottom: vars.space.xs,
});

export const aboutCardText = style({
  fontSize: '14px',
  lineHeight: 1.7,
  color: vars.color.textMuted,
});

/* ── Guest Features ── */

export const guestSection = style({
  padding: `${vars.space.hero} 0`,
  background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
});

export const guestInner = style({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: `0 ${vars.space.md}`,
});

export const guestHeader = style({
  textAlign: 'center',
  marginBottom: vars.space.xxl,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
});

export const guestBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.xs} ${vars.space.md}`,
  borderRadius: vars.radius.pill,
  background: vars.color.accentWash,
  border: vars.border.accent,
  color: vars.color.accent,
  fontFamily: vars.font.mono,
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
});

export const guestTitle = style({
  fontFamily: vars.font.display,
  fontSize: '36px',
  fontWeight: 500,
  letterSpacing: '-0.02em',
  color: vars.color.text,
});

export const guestSubtitle = style({
  fontSize: '16px',
  lineHeight: 1.7,
  color: vars.color.textMuted,
  maxWidth: '600px',
});

export const statsRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: vars.space.md,
  marginBottom: vars.space.xxl,
  '@media': {
    'screen and (max-width: 640px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  },
});

export const statCard = style({
  textAlign: 'center',
  padding: vars.space.lg,
  background: vars.color.surfaceSoft,
  border: vars.border.subtle,
  borderRadius: vars.radius.lg,
});

export const statNumber = style({
  fontFamily: vars.font.display,
  fontSize: '36px',
  fontWeight: 600,
  letterSpacing: '-0.02em',
  color: vars.color.accent,
  lineHeight: 1,
  marginBottom: vars.space.xxs,
  '@media': {
    'screen and (max-width: 640px)': {
      fontSize: '28px',
    },
  },
});

export const statLabel = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
});

export const guestGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: vars.space.md,
  '@media': {
    'screen and (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    'screen and (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const featureCard = style({
  position: 'relative',
  background: vars.color.surfaceSoft,
  border: vars.border.subtle,
  borderRadius: vars.radius.lg,
  padding: vars.space.lg,
  transition: 'all 240ms ease',
  selectors: {
    '&:hover': {
      background: vars.color.overlay,
      borderColor: vars.color.borderAccent,
    },
  },
});

export const featureRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.md,
});

export const featureIconFrame = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: vars.radius.md,
  background: vars.color.accentWash,
  flexShrink: 0,
  color: vars.color.accent,
  transition: 'background 240ms ease',
  selectors: {
    [`${featureCard}:hover &`]: {
      background: vars.color.accentSoft,
    },
  },
});

export const featureBody = style({
  minWidth: 0,
});

export const featureHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  marginBottom: vars.space.xxs,
});

export const featureTitle = style({
  fontWeight: 600,
  fontSize: '14px',
  color: vars.color.text,
});

export const featureTag = style({
  fontFamily: vars.font.mono,
  fontSize: '10px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const featureDesc = style({
  fontSize: '12px',
  lineHeight: 1.6,
  color: vars.color.textMuted,
});

export const guestCta = style({
  textAlign: 'center',
  marginTop: vars.space.xxl,
});
