import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/obsidianTheme.css.ts';

/* ── root ── */
export const root = style({
  position: 'relative',
  padding: `0 ${vars.space.md}`,
  '@media': {
    'screen and (min-width: 768px)': { padding: `0 ${vars.space.xl}` },
  },
});

/* ── filter bar — underline text tabs ── */
export const filterBar = style({
  position: 'sticky',
  top: vars.space.md,
  zIndex: 20,
  marginBottom: vars.space.xl,
  background: vars.color.background,
  borderBottom: `1px solid ${vars.color.borderStrong}`,
});

export const filterInner = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${vars.space.lg} ${vars.space.md}`,
  padding: `${vars.space.sm} 0`,
});

const tabUnderline = {
  content: '""',
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: `calc(-1 * ${vars.space.sm})`,
  height: '2px',
  background: vars.color.accent,
  transform: 'scaleX(0)',
  transformOrigin: 'left center',
  transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
};

export const filterBtn = style({
  position: 'relative',
  background: 'transparent',
  border: 'none',
  padding: `${vars.space.xs} 1px`,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'color 180ms ease',
  selectors: {
    '&::after': tabUnderline,
    '&:hover': { color: vars.color.text },
    '&:hover::after': { transform: 'scaleX(1)' },
  },
});

export const filterBtnActive = style({
  color: vars.color.accentHover,
  selectors: {
    '&::after': { ...tabUnderline, transform: 'scaleX(1)' },
  },
});

/* ── scroll-to-top — a square hairline button ── */
export const scrollBtn = style({
  position: 'fixed',
  right: vars.space.lg,
  bottom: vars.space.xl,
  zIndex: 30,
  width: '42px',
  height: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: vars.color.background,
  border: vars.border.strong,
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'opacity 200ms ease, color 180ms ease, border-color 180ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.accentHover,
      borderColor: vars.color.accentHover,
    },
  },
});

export const scrollBtnVisible = style({ opacity: 1, pointerEvents: 'auto' });
export const scrollBtnHidden = style({ opacity: 0, pointerEvents: 'none' });

/* ── the timeline — one spine, hairline rows ── */
export const timeline = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
});

export const event = style({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 140px minmax(0, 2.2fr)',
  gap: vars.space.lg,
  padding: `${vars.space.lg} 0`,
  borderBottom: `1px solid ${vars.color.lineSoft}`,
  selectors: {
    '&:last-child': { borderBottom: 'none' },
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '150px',
      top: 0,
      bottom: 0,
      width: '1px',
      background: vars.color.borderStrong,
    },
  },
  '@media': {
    'screen and (max-width: 760px)': {
      gridTemplateColumns: '72px minmax(0, 1fr)',
      gap: vars.space.md,
      selectors: {
        '&::before': {
          left: '84px',
        },
      },
    },
  },
});

export const yearCritical = style({
  color: vars.color.accentHover,
});

/* The node on the spine */
export const node = style({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '10px',
});

export const nodeDot = style({
  width: '7px',
  height: '7px',
  background: vars.color.background,
  border: `1px solid ${vars.color.accent}`,
  transform: 'rotate(45deg)',
  transition: 'background 200ms ease',
});

export const nodeDotActive = style({
  background: vars.color.accent,
});

/* The date column — big serif year over a tracked label */
export const when = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '6px',
  textAlign: 'right',
  paddingRight: vars.space.xs,
});

export const year = style({
  fontFamily: vars.font.display,
  fontSize: '30px',
  fontWeight: 500,
  lineHeight: 1,
  letterSpacing: '0.02em',
  color: vars.color.text,
  fontVariantNumeric: 'tabular-nums',
});

export const dateLabel = style({
  fontFamily: vars.font.label,
  fontSize: '9.5px',
  fontWeight: 500,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const catLabel = style({
  fontFamily: vars.font.label,
  fontSize: '9px',
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: vars.color.accentHover,
});

/* The event body */
export const body = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const title = style({
  margin: 0,
  fontFamily: vars.font.body,
  fontSize: '18px',
  fontWeight: 500,
  lineHeight: 1.35,
  color: vars.color.text,
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.xs,
  cursor: 'pointer',
});

export const titleIcon = style({
  color: vars.color.textFaint,
  flexShrink: 0,
  transition: 'color 160ms ease',
  selectors: {
    [`${title}:hover &`]: { color: vars.color.accentHover },
  },
});

export const desc = style({
  margin: 0,
  fontFamily: vars.font.body,
  fontSize: '14px',
  lineHeight: 1.7,
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const metaLine = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const people = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.xs,
  marginTop: '2px',
});

export const personTag = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `3px ${vars.space.sm}`,
  border: vars.border.subtle,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
  textDecoration: 'none',
  transition: 'color 160ms ease, border-color 160ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.accentHover,
      borderColor: vars.color.accentHover,
    },
  },
});

export const eventImage = style({
  marginTop: vars.space.xs,
  border: vars.border.strong,
  background: vars.color.surface,
  padding: '6px',
  width: 'fit-content',
  maxWidth: '100%',
});

export const eventImg = style({
  display: 'block',
  maxHeight: '180px',
  maxWidth: '100%',
  width: 'auto',
});

/* ── states ── */
export const loadingWrap = style({
  padding: `${vars.space.xxl} 0`,
  textAlign: 'center',
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
});

export const emptyWrap = style({
  padding: `${vars.space.xxl} 0`,
  textAlign: 'center',
  color: vars.color.textMuted,
});

/* ── detail modal — flat ink panel ── */
export const modalOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 90,
  background: 'rgba(4, 5, 8, 0.88)',
});

export const modalPanel = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 95,
  width: 'min(640px, calc(100vw - 32px))',
  maxHeight: '85vh',
  overflowY: 'auto',
  background: vars.color.surface,
  border: vars.border.strong,
  padding: vars.space.xxl,
});

export const modalClose = style({
  position: 'absolute',
  top: vars.space.md,
  right: vars.space.md,
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: vars.border.subtle,
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'color 160ms ease, border-color 160ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.accentHover,
      borderColor: vars.color.accentHover,
    },
  },
});

export const modalHero = style({
  display: 'block',
  width: 'calc(100% + 96px)',
  margin: `-${vars.space.xxl} -${vars.space.xxl} ${vars.space.lg}`,
  maxHeight: '280px',
  objectFit: 'cover',
  borderBottom: vars.border.subtle,
});

export const modalCategory = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: vars.color.accentHover,
  marginBottom: vars.space.sm,
});

export const modalTitle = style({
  margin: `0 0 ${vars.space.md}`,
  fontFamily: vars.font.display,
  fontSize: '34px',
  fontWeight: 500,
  lineHeight: 1.1,
  letterSpacing: '0.01em',
  color: vars.color.text,
  maxWidth: '85%',
});

export const modalRule = style({
  width: '44px',
  height: '2px',
  background: vars.color.accent,
  margin: `0 0 ${vars.space.md}`,
});

export const modalMeta = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${vars.space.md} ${vars.space.lg}`,
  marginBottom: vars.space.lg,
});

export const modalMetaItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  fontVariantNumeric: 'tabular-nums',
});

export const modalDivider = style({
  border: 'none',
  borderTop: `1px solid ${vars.color.lineSoft}`,
  margin: `0 0 ${vars.space.lg}`,
});

export const modalBody = style({
  margin: 0,
  fontFamily: vars.font.body,
  fontSize: '15.5px',
  lineHeight: 1.85,
  fontWeight: 300,
  color: vars.color.textSoft,
  selectors: {
    '&::first-letter': {
      fontFamily: vars.font.display,
      fontWeight: 600,
      fontSize: '3em',
      float: 'left',
      lineHeight: 0.82,
      paddingRight: '0.12em',
      paddingTop: '0.05em',
      color: vars.color.accentHover,
    },
  },
});

export const modalPeople = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.xs,
  marginTop: vars.space.lg,
});

/* ── glossary matches — hairline rows ── */
export const glossarySection = style({
  marginTop: vars.space.xl,
  borderTop: vars.border.subtle,
  paddingTop: vars.space.lg,
});

export const glossarySectionTitle = style({
  margin: `0 0 ${vars.space.md}`,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: vars.color.accentHover,
});

export const glossaryCard = style({
  padding: `${vars.space.md} 0`,
  borderBottom: `1px solid ${vars.color.lineSoft}`,
});

export const glossaryCardTerm = style({
  fontFamily: vars.font.body,
  fontSize: '16px',
  fontWeight: 500,
  color: vars.color.text,
  marginRight: vars.space.sm,
});

export const glossaryCardType = style({
  fontFamily: vars.font.label,
  fontSize: '9px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const glossaryCardExcerpt = style({
  margin: `${vars.space.xs} 0`,
  fontFamily: vars.font.body,
  fontSize: '13.5px',
  lineHeight: 1.7,
  fontWeight: 300,
  color: vars.color.textMuted,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const glossaryCardLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: vars.color.accentHover,
  textDecoration: 'none',
  transition: 'color 160ms ease',
  selectors: {
    '&:hover': { color: vars.color.text },
  },
});
