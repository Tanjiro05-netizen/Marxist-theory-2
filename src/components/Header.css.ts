import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

/* Band ink — the dark text that lives on the paper navband */
const bandInk = '#14161d';
const bandInkFaint = 'rgba(20, 22, 29, 0.72)';
const bandHairline = 'rgba(20, 22, 29, 0.16)';
const bandAccent = '#b3122e';
/* Parchment gold — the warm tan plate that marks hovered/active selectors */
const bandHighlight = '#e0ccaa';

/* ── Masthead — centered, scrolls away ── */

export const masthead = style({
  textAlign: 'center',
  padding: `26px ${vars.space.md} 20px`,
});

export const mastheadLink = style({
  display: 'inline-block',
  textDecoration: 'none',
});

export const mastheadWord = style({
  fontFamily: vars.font.display,
  fontSize: 'clamp(22px, 3.2vw, 34px)',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  lineHeight: 1,
  color: vars.color.text,
});

export const mastheadDot = style({
  color: vars.color.accentHover,
});

export const mastheadRule = style({
  display: 'block',
  width: '32px',
  height: '2px',
  background: vars.color.accent,
  margin: '12px auto 0',
  transition: 'width 300ms cubic-bezier(0.22, 1, 0.36, 1)',
  selectors: {
    [`${mastheadLink}:hover &`]: {
      width: '52px',
    },
  },
});

/* ── Paper navband — sticky ── */

export const navband = style({
  position: 'sticky',
  top: 0,
  zIndex: 50,
  background: '#f4f2ec',
  borderTop: `1px solid ${bandHairline}`,
  borderBottom: `1px solid ${bandHairline}`,
  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.3)',
});

export const navbandInner = style({
  // Wider than the content layout: the band must hold 13 uppercase nav items
  // plus both flanks, and the flanks keep min-content width, so every pixel
  // of track pressure otherwise lands between the search/EN slot and HOME.
  maxWidth: '1680px',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  columnGap: vars.space.md,
  alignItems: 'center',
  minHeight: '46px',
  padding: `0 ${vars.space.md}`,
});

export const bandSlot = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
});

export const bandSlotRight = style({
  justifyContent: 'flex-end',
});

export const desktopNav = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '@media': {
    'screen and (max-width: 768px)': {
      display: 'none',
    },
  },
});

export const navRow = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'nowrap',
  overflowX: 'visible',
  overflowY: 'visible',
  scrollbarWidth: 'none',
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
});

/* Link states are split into idle / active / restricted variants so exactly
   one highlight-plate rule is ever applied per link. */

export const navLink = style({
  position: 'relative',
  zIndex: 0,
  display: 'inline-flex',
  alignItems: 'center',
  height: '46px',
  padding: '0 7px',
  fontFamily: vars.font.label,
  fontSize: '10.5px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: bandInk,
  whiteSpace: 'nowrap',
  transition: 'color 180ms ease',
  '@media': {
    'screen and (max-width: 1365px)': {
      fontSize: '10px',
      letterSpacing: '0.12em',
      padding: '0 5px',
    },
  },
});

const navFill = {
  content: '""',
  position: 'absolute',
  inset: 0,
  zIndex: -1,
  background: bandHighlight,
  transform: 'scaleY(0)',
  transformOrigin: 'bottom',
  transition: 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
};

const navFillMotionOff = {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      selectors: {
        '&::before': { transition: 'none' },
      },
    },
  },
};

export const navLinkIdle = style({
  selectors: {
    '&::before': navFill,
    '&:hover::before': { transform: 'scaleY(1)' },
    '&:focus-visible::before': { transform: 'scaleY(1)' },
  },
  ...navFillMotionOff,
});

export const navLinkActive = style({
  selectors: {
    '&::before': { ...navFill, transform: 'scaleY(1)' },
  },
});

export const navLinkRestricted = style({
  color: bandInk,
  selectors: {
    '&:hover': {
      color: bandAccent,
    },
  },
});

export const restrictedMark = style({
  marginLeft: vars.space.xxs,
  fontSize: '9px',
  color: bandInkFaint,
});

/* ── Dropdown ── */

export const dropdownWrap = style({
  position: 'relative',
});

export const dropdownTrigger = style({
  position: 'relative',
  zIndex: 0,
  display: 'flex',
  alignItems: 'center',
  height: '46px',
  padding: '0 7px',
  fontFamily: vars.font.label,
  fontSize: '10.5px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: bandInk,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  '@media': {
    'screen and (max-width: 1365px)': {
      fontSize: '10px',
      letterSpacing: '0.12em',
      padding: '0 5px',
    },
  },
  selectors: {
    '&::before': navFill,
    '&:hover::before': { transform: 'scaleY(1)' },
    '&:focus-visible::before': { transform: 'scaleY(1)' },
  },
  ...navFillMotionOff,
});

export const dropdownTriggerActive = style({
  selectors: {
    '&::before': { ...navFill, transform: 'scaleY(1)' },
  },
});

export const dropdownMenu = style({
  position: 'absolute',
  left: 0,
  top: '100%',
  width: '250px',
  background: '#ffffff',
  border: `1px solid ${bandHairline}`,
  borderRadius: vars.radius.tiny,
  boxShadow: vars.shadow.panel,
  padding: `${vars.space.xxs} 0`,
  opacity: 0,
  visibility: 'hidden' as any,
  transition: 'opacity 180ms ease, visibility 180ms ease',
  zIndex: 60,
  selectors: {
    [`${dropdownWrap}:hover &`]: {
      opacity: 1,
      visibility: 'visible' as any,
    },
  },
});

export const dropdownItem = style({
  display: 'block',
  padding: `${vars.space.sm} ${vars.space.lg}`,
  borderRadius: vars.radius.tiny,
  fontFamily: vars.font.body,
  fontSize: '14px',
  color: bandInk,
  transition: 'color 140ms ease, background 140ms ease',
  selectors: {
    '&:hover': {
      background: 'rgba(179, 18, 46, 0.06)',
      color: bandAccent,
    },
  },
});

export const dropdownItemActive = style({
  color: bandAccent,
});

export const dropdownItemLabel = style({
  display: 'block',
  fontWeight: 500,
  marginBottom: '2px',
});

export const dropdownItemDesc = style({
  display: 'block',
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: bandInkFaint,
});

/* ── Band actions ── */

export const actionsRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
});

/* ── Band flanks — the printer's marks at either end of the navband ── */

export const bandIconLink = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '34px',
  color: bandInk,
  opacity: 0.65,
  transition: 'color 180ms ease, opacity 180ms ease',
  selectors: {
    '&:hover': {
      color: bandAccent,
      opacity: 1,
    },
  },
});

export const bandMark = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '34px',
  color: bandInk,
  opacity: 0.55,
  pointerEvents: 'none',
});

export const iconButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '34px',
  height: '34px',
  borderRadius: vars.radius.tiny,
  background: 'transparent',
  border: 'none',
  color: bandInk,
  opacity: 0.7,
  cursor: 'pointer',
  transition: 'color 180ms ease, opacity 180ms ease',
  selectors: {
    '&:hover': {
      color: bandAccent,
      opacity: 1,
    },
  },
});

export const notificationWrap = style({
  position: 'relative',
});

export const notificationBadge = style({
  position: 'absolute',
  top: '4px',
  right: '3px',
  minWidth: '16px',
  height: '16px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.pill,
  background: vars.color.accent,
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: 700,
  lineHeight: 1,
  padding: '0 4px',
});

export const notificationPanel = style({
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 8px)',
  width: '360px',
  maxWidth: 'calc(100vw - 24px)',
  maxHeight: '520px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  border: vars.border.strong,
  borderRadius: vars.radius.tiny,
  background: vars.color.surface,
  boxShadow: vars.shadow.panel,
  zIndex: 80,
});

export const notificationPanelHeader = style({
  minHeight: '46px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  padding: `0 ${vars.space.md}`,
  borderBottom: vars.border.subtle,
  color: vars.color.text,
  fontSize: '14px',
  fontWeight: 700,
});

export const notificationList = style({
  overflowY: 'auto',
});

export const notificationItem = style({
  width: '100%',
  display: 'block',
  padding: `${vars.space.sm} ${vars.space.md}`,
  border: 0,
  borderBottom: vars.border.subtle,
  background: 'transparent',
  color: vars.color.textSoft,
  textAlign: 'left',
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      background: vars.color.surfaceRaised,
      color: vars.color.text,
    },
  },
});

export const notificationItemUnread = style({
  background: vars.color.accentWash,
});

export const notificationText = style({
  display: 'block',
  fontSize: '13px',
  lineHeight: 1.35,
});

export const notificationMeta = style({
  display: 'block',
  marginTop: vars.space.xxs,
  color: vars.color.textFaint,
  fontSize: '11px',
});

export const notificationAction = style({
  background: 'transparent',
  border: 0,
  color: vars.color.textMuted,
  cursor: 'pointer',
  fontSize: '12px',
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
});

export const loginButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `9px ${vars.space.lg}`,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  color: '#ffffff',
  border: `1px solid ${bandAccent}`,
  background: bandAccent,
  borderRadius: vars.radius.tiny,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background 200ms ease, border-color 200ms ease',
  selectors: {
    '&:hover': {
      background: '#d41f3d',
      borderColor: '#d41f3d',
    },
  },
});

/* ── Mobile ── */

export const mobileMenuBtn = style([iconButton, {
  '@media': {
    'screen and (min-width: 769px)': {
      display: 'none',
    },
  },
}]);

export const mobileOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: vars.color.background,
  paddingTop: '72px',
  overflowY: 'auto',
  '@media': {
    'screen and (min-width: 769px)': {
      display: 'none',
    },
  },
});

export const mobileInner = style({
  maxWidth: '820px',
  margin: '0 auto',
  padding: `${vars.space.xl} ${vars.space.md}`,
  display: 'flex',
  flexDirection: 'column',
});

export const mobileCloseRow = style({
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: vars.space.md,
});

/* iconButton restyled for the ink mobile overlay (band colors would vanish) */
export const mobileCloseButton = style([iconButton, {
  color: vars.color.textMuted,
  border: vars.border.strong,
  selectors: {
    '&:hover': {
      color: vars.color.accentHover,
    },
  },
}]);

export const mobileNavStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  borderTop: vars.border.subtle,
  borderBottom: vars.border.subtle,
  padding: `${vars.space.lg} 0`,
});

export const mobileLink = style({
  display: 'flex',
  alignItems: 'center',
  padding: '10px 0',
  fontFamily: vars.font.label,
  fontSize: '12px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  color: vars.color.text,
  borderBottom: vars.border.subtle,
  transition: 'color 180ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.accentHover,
    },
  },
});

export const mobileLinkActive = style({
  color: vars.color.accentHover,
});

export const mobileLinkRestricted = style({
  color: vars.color.textFaint,
  selectors: {
    '&:hover': {
      color: vars.color.textMuted,
    },
  },
});

export const mobileGroupLabel = style({
  fontFamily: vars.font.label,
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.24em',
  color: vars.color.accentHover,
});

export const mobileSubStack = style({
  paddingLeft: vars.space.md,
  borderLeft: vars.border.strong,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  margin: `${vars.space.xs} 0`,
});

export const mobileSubLink = style({
  display: 'block',
  fontFamily: vars.font.body,
  fontSize: '16px',
  color: vars.color.textSoft,
  transition: 'color 180ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.accentHover,
    },
  },
});

export const mobileSubDesc = style({
  display: 'block',
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const mobileComingSoon = style({
  marginLeft: vars.space.xs,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const mobileActions = style({
  marginTop: vars.space.xl,
  display: 'flex',
  justifyContent: 'center',
  gap: vars.space.lg,
});

export const mobileLogout = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  fontFamily: vars.font.label,
  fontSize: '12px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  color: vars.color.text,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  transition: 'color 180ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.accentHover,
    },
  },
});
