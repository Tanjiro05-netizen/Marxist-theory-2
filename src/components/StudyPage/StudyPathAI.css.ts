import { style, styleVariants } from '@vanilla-extract/css';
import { actionButton, badge, panelInset, vars } from './studyTheme.css.ts';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  minHeight: '540px',
});

export const tabs = style([panelInset, {
  padding: vars.space.xxs,
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: vars.space.xxs,
}]);

export const tabButton = styleVariants({
  active: {
    minHeight: '40px',
    borderRadius: vars.radius.pill,
    border: vars.border.accent,
    background: vars.color.accentSoft,
    color: vars.color.text,
    cursor: 'pointer',
    fontFamily: vars.font.label,
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vars.space.xs,
    boxShadow: vars.shadow.glow,
  },
  idle: {
    minHeight: '40px',
    borderRadius: vars.radius.pill,
    border: '1px solid transparent',
    background: 'transparent',
    color: vars.color.textMuted,
    cursor: 'pointer',
    fontFamily: vars.font.label,
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vars.space.xs,
    transition: 'all 180ms ease',
    selectors: {
      '&:hover': {
        color: vars.color.text,
        background: vars.color.surfaceSoft,
      },
    },
  },
});

export const content = style({
  flex: 1,
  minHeight: 0,
});

export const pathView = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  height: '100%',
});

export const insightCard = style([panelInset, {
  padding: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  borderColor: vars.color.borderAccent,
  background: `linear-gradient(180deg, ${vars.color.accentWash} 0%, ${vars.color.surfaceRaised} 100%)`,
}]);

export const insightBadge = badge({ tone: 'accent' });

export const insightText = style({
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.8,
  fontWeight: 300,
  color: vars.color.textSoft,
});

export const pathList = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  paddingLeft: vars.space.lg,
  minHeight: 0,
  overflowY: 'auto',
});

export const pathLine = style({
  position: 'absolute',
  top: vars.space.md,
  bottom: vars.space.md,
  left: '10px',
  width: '1px',
  background: `linear-gradient(180deg, ${vars.color.borderAccent} 0%, ${vars.color.border} 100%)`,
});

export const pathItem = style({
  position: 'relative',
  paddingLeft: vars.space.lg,
});

export const pathMarker = styleVariants({
  pending: {
    position: 'absolute',
    left: 0,
    top: vars.space.md,
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: vars.border.accent,
    background: vars.color.background,
    color: vars.color.accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: vars.font.label,
    fontSize: '10px',
    boxShadow: vars.shadow.soft,
  },
  completed: {
    position: 'absolute',
    left: 0,
    top: vars.space.md,
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: vars.border.accent,
    background: vars.color.accent,
    color: vars.color.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: vars.shadow.glow,
  },
});

export const pathCard = style([panelInset, {
  padding: vars.space.md,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  transition: 'transform 180ms ease, border-color 180ms ease, background 180ms ease',
  selectors: {
    '&:hover': {
      transform: 'translateX(3px)',
      borderColor: vars.color.borderStrong,
      background: vars.color.surfaceRaised,
    },
  },
}]);

export const pathCardState = styleVariants({
  pending: {},
  completed: {
    borderColor: vars.color.borderAccent,
    background: vars.color.accentWash,
  },
});

export const pathHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  alignItems: 'flex-start',
});

export const pathTitle = style({
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.6,
  fontWeight: 400,
  color: vars.color.text,
});

export const pathSubtitle = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  lineHeight: 1.5,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const pathText = style({
  margin: 0,
  fontSize: '13px',
  lineHeight: 1.75,
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const resourceMeta = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  fontFamily: vars.font.label,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: vars.color.accent,
});

export const chatView = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: '430px',
  gap: vars.space.md,
});

export const messages = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  paddingRight: vars.space.xs,
});

export const messageRow = styleVariants({
  bot: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  user: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

export const messageCluster = styleVariants({
  bot: {
    maxWidth: '86%',
    display: 'grid',
    gridTemplateColumns: '34px minmax(0, 1fr)',
    gap: vars.space.sm,
    alignItems: 'start',
  },
  user: {
    maxWidth: '86%',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 34px',
    gap: vars.space.sm,
    alignItems: 'start',
  },
});

export const avatar = styleVariants({
  bot: {
    width: '34px',
    height: '34px',
    borderRadius: vars.radius.md,
    border: vars.border.accent,
    background: vars.color.accentWash,
    color: vars.color.accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  user: {
    width: '34px',
    height: '34px',
    borderRadius: vars.radius.md,
    border: vars.border.accent,
    background: vars.color.accent,
    color: vars.color.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: vars.shadow.glow,
  },
});

export const bubble = styleVariants({
  bot: {
    padding: `${vars.space.md} ${vars.space.md}`,
    borderRadius: `${vars.radius.lg} ${vars.radius.lg} ${vars.radius.lg} ${vars.radius.sm}`,
    background: vars.color.surfaceSoft,
    border: vars.border.subtle,
    color: vars.color.textSoft,
    fontSize: '13px',
    lineHeight: 1.75,
    fontWeight: 300,
  },
  user: {
    padding: `${vars.space.md} ${vars.space.md}`,
    borderRadius: `${vars.radius.lg} ${vars.radius.lg} ${vars.radius.sm} ${vars.radius.lg}`,
    background: vars.color.accent,
    border: vars.border.accent,
    color: vars.color.text,
    fontSize: '13px',
    lineHeight: 1.75,
    fontWeight: 300,
  },
});

export const messageBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minWidth: 0,
});

export const sourceList = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space.xs,
});

export const sourceListLabel = style({
  fontFamily: vars.font.label,
  fontSize: '9px',
  lineHeight: 1,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const sourceChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  maxWidth: '100%',
  borderRadius: vars.radius.pill,
  border: vars.border.subtle,
  background: vars.color.surfaceSoft,
  color: vars.color.textMuted,
  padding: '5px 8px',
  fontSize: '10px',
  lineHeight: 1,
  textDecoration: 'none',
  transition: 'border-color 160ms ease, color 160ms ease, background 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: vars.color.borderAccent,
      color: vars.color.text,
      background: vars.color.accentWash,
    },
  },
});

export const sourceMarker = style({
  fontFamily: vars.font.label,
  color: vars.color.accent,
});

export const sourceTitle = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const typingBubble = style([panelInset, {
  display: 'inline-flex',
  gap: '6px',
  alignItems: 'center',
  padding: `${vars.space.sm} ${vars.space.md}`,
  width: 'fit-content',
}]);

export const typingDot = style({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: vars.color.textFaint,
});

export const composer = style([panelInset, {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: vars.space.sm,
  alignItems: 'center',
  padding: vars.space.sm,
}]);

export const composerInput = style({
  minHeight: '44px',
  border: 'none',
  background: 'transparent',
  color: vars.color.text,
  fontSize: '14px',
  outline: 'none',
});

export const sendButton = actionButton({ tone: 'accent', size: 'sm' });
