import { style, styleVariants } from '@vanilla-extract/css';
import { badge, filterPill, panelInset, textLink, vars } from './studyTheme.css.ts';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
});

export const filterBar = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
  paddingBottom: vars.space.lg,
  borderBottom: vars.border.subtle,
});

export const filterButton = filterPill;

export const list = style({
  display: 'grid',
  gap: vars.space.md,
});

export const card = style([panelInset, {
  display: 'grid',
  gridTemplateColumns: '56px minmax(0, 1fr) auto',
  gap: vars.space.lg,
  alignItems: 'start',
  padding: vars.space.lg,
  transition: 'transform 180ms ease, border-color 180ms ease, background 180ms ease',
  selectors: {
    '&:hover': {
      transform: 'translateY(-2px)',
      borderColor: vars.color.borderAccent,
      background: vars.color.surfaceRaised,
    },
  },
  '@media': {
    'screen and (max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
}]);

export const featuredCard = style({
  borderColor: vars.color.borderAccent,
  boxShadow: vars.shadow.glow,
  background: `linear-gradient(180deg, ${vars.color.surfaceSoft} 0%, ${vars.color.surfaceRaised} 100%)`,
});

export const iconFrame = styleVariants({
  text: {
    width: '56px',
    height: '56px',
    borderRadius: vars.radius.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(179, 18, 46,0.12)',
    color: vars.color.accent,
    border: `1px solid rgba(179, 18, 46,0.22)`,
  },
  video: {
    width: '56px',
    height: '56px',
    borderRadius: vars.radius.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(74,127,181,0.16)',
    color: vars.color.info,
    border: `1px solid rgba(74,127,181,0.22)`,
  },
  lecture: {
    width: '56px',
    height: '56px',
    borderRadius: vars.radius.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(74,127,181,0.16)',
    color: vars.color.info,
    border: `1px solid rgba(74,127,181,0.22)`,
  },
  audio: {
    width: '56px',
    height: '56px',
    borderRadius: vars.radius.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(133,90,214,0.16)',
    color: '#8a84b8',
    border: `1px solid rgba(133,90,214,0.22)`,
  },
});

export const content = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
});

export const badgeRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.xs,
});

export const typeBadge = styleVariants({
  text: [badge({ tone: 'accent' })],
  video: [badge({ tone: 'info' })],
  lecture: [badge({ tone: 'info' })],
  audio: [badge({ tone: 'warning' })],
});

export const featuredBadge = badge({ tone: 'warning' });
export const libraryBadge = badge({ tone: 'success' });

export const title = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '30px',
  lineHeight: 1,
  color: vars.color.text,
  letterSpacing: '-0.03em',
});

export const author = style({
  margin: 0,
  fontSize: '12px',
  fontWeight: 300,
  lineHeight: 1.6,
  color: vars.color.textFaint,
});

export const excerpt = style({
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.8,
  fontWeight: 300,
  color: vars.color.textMuted,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const footer = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: vars.space.md,
  alignItems: 'center',
  flexWrap: 'wrap',
});

export const meta = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: vars.color.textFaint,
});

export const action = style([textLink, {
  alignSelf: 'center',
  minHeight: '36px',
  padding: `0 ${vars.space.md}`,
  borderRadius: vars.radius.pill,
  border: vars.border.subtle,
  background: vars.color.surface,
  selectors: {
    '&:hover': {
      borderColor: vars.color.borderAccent,
      background: vars.color.accentWash,
    },
  },
}]);
