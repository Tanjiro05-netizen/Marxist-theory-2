import { style } from '@vanilla-extract/css';
import { vars, hairlineGrid, hairlineCell, ruleWipe } from './styles/obsidianTheme.css.ts';

export const page = style({
  minHeight: '100vh',
  background: vars.color.background,
});

/* ── Hero — original imagery, editorial composition ── */

export const hero = style({
  position: 'relative',
  height: '100vh',
  minHeight: '560px',
  overflow: 'hidden',
});

export const heroGrid = style({
  position: 'absolute',
  inset: 0,
  backgroundImage: 'radial-gradient(rgba(179, 18, 46,0.12) 1px, transparent 1px)',
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
  alignItems: 'center',
  gap: vars.space.lg,
  maxWidth: '820px',
  padding: `0 ${vars.space.md}`,
});

export const heroKicker = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.34em',
  color: vars.color.accentHover,
});

export const heroTitle = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: 'clamp(56px, 8vw, 96px)',
  fontWeight: 500,
  letterSpacing: '0.02em',
  lineHeight: 1,
  color: vars.color.text,
  '@media': {
    'screen and (max-width: 640px)': {
      fontSize: '44px',
    },
  },
});

export const heroDot = style({
  color: vars.color.accentHover,
});

export const heroRule = style({
  width: '44px',
  height: '2px',
  background: vars.color.accent,
});

export const heroSubtitle = style({
  margin: 0,
  maxWidth: '560px',
  fontFamily: vars.font.body,
  fontStyle: 'italic',
  fontSize: '20px',
  lineHeight: 1.65,
  fontWeight: 300,
  color: vars.color.textSoft,
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
  marginTop: vars.space.xs,
});

export const ctaPrimary = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  padding: `13px ${vars.space.xl}`,
  background: vars.color.accent,
  color: '#ffffff',
  borderRadius: vars.radius.tiny,
  fontFamily: vars.font.label,
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  border: 'none',
  cursor: 'pointer',
  transition: 'background 180ms ease',
  selectors: {
    '&:hover': {
      background: vars.color.accentHover,
    },
  },
});

export const ctaGhost = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  padding: `13px ${vars.space.xl}`,
  background: 'transparent',
  color: vars.color.text,
  borderRadius: vars.radius.tiny,
  fontFamily: vars.font.label,
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  border: vars.border.strong,
  cursor: 'pointer',
  transition: 'color 180ms ease, border-color 180ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.accentHover,
      borderColor: vars.color.accentHover,
    },
  },
});

/* Printer's corner marks on the front page */
export const heroCorner = style({
  position: 'absolute',
  top: '26px',
  fontFamily: vars.font.label,
  fontSize: '9px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.3em',
  color: vars.color.textFaint,
  pointerEvents: 'none',
  zIndex: 2,
  '@media': {
    'screen and (max-width: 768px)': {
      display: 'none',
    },
  },
});

export const heroCornerLeft = style({ left: vars.space.xl });
export const heroCornerRight = style({ right: vars.space.xl });

/* Scroll cue — a tracked label above a short hairline */
export const scrollCue = style({
  position: 'absolute',
  bottom: '28px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
  pointerEvents: 'none',
  zIndex: 2,
});

export const scrollLabel = style({
  fontFamily: vars.font.label,
  fontSize: '9px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.3em',
  color: vars.color.textFaint,
});

export const scrollLine = style({
  width: '1px',
  height: '34px',
  background: `linear-gradient(${vars.color.borderStrong}, transparent)`,
});

/* ── Sections — the platform table of contents ── */

export const sectionBlock = style({
  padding: `${vars.space.xxxl} 0`,
});

export const innerWrap = style({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: `0 ${vars.space.md}`,
});

export const guestIntro = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.md,
  textAlign: 'center',
  marginBottom: vars.space.xxl,
});

export const guestBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `6px ${vars.space.md}`,
  borderRadius: vars.radius.tiny,
  background: vars.color.accentWash,
  border: vars.border.accent,
  color: vars.color.accentHover,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
});

export const guestLead = style({
  margin: 0,
  maxWidth: '520px',
  fontFamily: vars.font.body,
  fontStyle: 'italic',
  fontSize: '16px',
  lineHeight: 1.7,
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const sectionRow = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: vars.space.md,
  marginBottom: vars.space.xl,
});

export const sectionLabel = style({
  fontFamily: vars.font.label,
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.28em',
  color: vars.color.accentHover,
});

export const sectionIndex = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  fontVariantNumeric: 'tabular-nums',
});

export const grid = style([hairlineGrid, {
  gridTemplateColumns: 'repeat(3, 1fr)',
  '@media': {
    'screen and (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    'screen and (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
}]);

export const cell = style([hairlineCell, ruleWipe, {
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.md,
  padding: vars.space.lg,
  textDecoration: 'none',
  transition: 'background 220ms ease',
  selectors: {
    '&:hover': {
      background: vars.color.surfaceRaised,
    },
  },
}]);

export const iconFrame = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  marginTop: '2px',
  borderRadius: vars.radius.tiny,
  background: vars.color.accentWash,
  border: vars.border.accent,
  color: vars.color.accentHover,
  flexShrink: 0,
});

export const cellBody = style({
  minWidth: 0,
});

export const cellHeader = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.sm,
  marginBottom: vars.space.xs,
  minWidth: 0,
});

export const cellIndex = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.08em',
  color: vars.color.textFaint,
  fontVariantNumeric: 'tabular-nums',
});

export const cellTitle = style({
  fontFamily: vars.font.display,
  fontSize: '19px',
  fontWeight: 500,
  lineHeight: 1.25,
  letterSpacing: '0.01em',
  color: vars.color.text,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const cellTag = style({
  marginLeft: 'auto',
  alignSelf: 'center',
  padding: '3px 8px',
  fontFamily: vars.font.label,
  fontSize: '9px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  whiteSpace: 'nowrap',
  border: vars.border.subtle,
  borderRadius: vars.radius.tiny,
  flexShrink: 0,
});

export const cellDesc = style({
  fontFamily: vars.font.body,
  fontSize: '13.5px',
  lineHeight: 1.75,
  color: vars.color.textSoft,
});

export const cellArrow = style({
  marginLeft: 'auto',
  alignSelf: 'center',
  color: vars.color.textFaint,
  flexShrink: 0,
  transition: 'color 220ms ease, transform 220ms ease',
  selectors: {
    [`${cell}:hover &`]: {
      color: vars.color.accentHover,
      transform: 'translate(2px, -2px)',
    },
  },
});

/* ── About — an epigraph between hairlines, original cards inside ── */

export const aboutSection = style({
  padding: `${vars.space.hero} 0`,
  background: '#10131b',
  borderTop: '1px solid #1c202b',
  borderBottom: '1px solid #1c202b',
});

export const aboutInner = style({
  maxWidth: '920px',
  margin: '0 auto',
  padding: `0 ${vars.space.md}`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.xl,
});

export const aboutKicker = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.32em',
  color: vars.color.accentHover,
});

export const epigraph = style({
  margin: 0,
  maxWidth: '720px',
  textAlign: 'center',
  fontFamily: vars.font.body,
  fontStyle: 'italic',
  fontSize: '19px',
  lineHeight: 1.9,
  fontWeight: 300,
  color: vars.color.textSoft,
});

export const aboutGrid = style([hairlineGrid, {
  gridTemplateColumns: 'repeat(2, 1fr)',
  width: '100%',
  '@media': {
    'screen and (max-width: 760px)': {
      gridTemplateColumns: '1fr',
    },
  },
}]);

export const aboutCell = style([hairlineCell, {
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.md,
  padding: vars.space.lg,
  textAlign: 'left',
}]);

export const aboutIconFrame = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  borderRadius: vars.radius.tiny,
  background: vars.color.accentWash,
  border: vars.border.accent,
  color: vars.color.accentHover,
  flexShrink: 0,
});

export const aboutCardTitle = style({
  margin: 0,
  fontFamily: vars.font.body,
  fontSize: '16px',
  fontWeight: 500,
  color: vars.color.text,
  marginBottom: vars.space.xxs,
});

export const aboutCardText = style({
  margin: 0,
  fontFamily: vars.font.body,
  fontSize: '13.5px',
  lineHeight: 1.7,
  color: vars.color.textMuted,
});

/* ── Closing CTA band (guests) ── */

export const ctaBand = style({
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: vars.space.md,
});
