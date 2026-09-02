import { style, styleVariants } from '@vanilla-extract/css';
import { panelInset, vars } from './studyTheme.css.ts';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
});

export const summary = style([panelInset, {
  padding: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
}]);

export const summaryHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: vars.space.md,
  flexWrap: 'wrap',
});

export const summaryLabel = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.textFaint,
});

export const summaryLevel = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '30px',
  lineHeight: 1,
  color: vars.color.text,
});

export const summaryMeta = style({
  margin: 0,
  fontSize: '13px',
  lineHeight: 1.7,
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const summaryValue = style({
  fontFamily: vars.font.label,
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.accent,
});

export const progressTrack = style({
  width: '100%',
  height: '6px',
  borderRadius: vars.radius.pill,
  background: vars.color.surface,
  overflow: 'hidden',
  border: vars.border.subtle,
});

export const progressFill = style({
  height: '100%',
  borderRadius: vars.radius.pill,
  background: `linear-gradient(90deg, ${vars.color.accentSoft} 0%, ${vars.color.accent} 100%)`,
  transition: 'width 360ms ease',
});

export const summaryStats = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: vars.space.sm,
});

export const statTile = style([panelInset, {
  padding: vars.space.sm,
  minHeight: '82px',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xxs,
  justifyContent: 'center',
}]);

export const statValue = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '28px',
  lineHeight: 0.95,
  color: vars.color.text,
});

export const statCopy = style({
  margin: 0,
  fontSize: '12px',
  lineHeight: 1.6,
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const timeline = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  paddingLeft: vars.space.xl,
});

export const timelineLine = style({
  position: 'absolute',
  top: vars.space.sm,
  bottom: vars.space.sm,
  left: '8px',
  width: '1px',
  background: `linear-gradient(180deg, ${vars.color.borderAccent} 0%, ${vars.color.border} 100%)`,
});

export const milestoneRow = style({
  position: 'relative',
  paddingLeft: vars.space.md,
});

export const milestoneBullet = styleVariants({
  pending: {
    position: 'absolute',
    left: 0,
    top: '18px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: `1px solid ${vars.color.borderStrong}`,
    background: vars.color.background,
    boxShadow: vars.shadow.soft,
  },
  completed: {
    position: 'absolute',
    left: 0,
    top: '18px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: `1px solid ${vars.color.borderAccent}`,
    background: vars.color.accent,
    boxShadow: vars.shadow.glow,
  },
});

export const milestoneButton = style([panelInset, {
  width: '100%',
  border: vars.border.subtle,
  borderRadius: vars.radius.lg,
  background: vars.color.surface,
  padding: vars.space.md,
  display: 'flex',
  justifyContent: 'space-between',
  gap: vars.space.md,
  alignItems: 'center',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'transform 180ms ease, border-color 180ms ease, background 180ms ease',
  selectors: {
    '&:hover': {
      transform: 'translateX(3px)',
      borderColor: vars.color.borderStrong,
      background: vars.color.surfaceRaised,
    },
    '&:focus-visible': {
      outline: `2px solid ${vars.color.accentGlow}`,
      outlineOffset: '2px',
    },
  },
}]);

export const milestoneButtonState = styleVariants({
  pending: {},
  completed: {
    borderColor: vars.color.borderAccent,
    background: vars.color.accentWash,
  },
});

export const milestoneCopy = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xxs,
});

export const milestoneTitle = style({
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.6,
  fontWeight: 400,
  color: vars.color.text,
});

export const milestoneSubtitle = style({
  margin: 0,
  fontSize: '12px',
  lineHeight: 1.65,
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const milestoneMeta = style({
  marginTop: vars.space.xxs,
  fontFamily: vars.font.label,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: vars.color.textFaint,
});

export const milestoneStateIcon = styleVariants({
  pending: {
    color: vars.color.textFaint,
    flexShrink: 0,
  },
  completed: {
    color: vars.color.accent,
    flexShrink: 0,
  },
});
