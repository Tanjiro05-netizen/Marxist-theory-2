import { style, globalStyle, keyframes } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

/* Band palette follows the page theme: these map to the global theme vars,
   which flip with html[data-theme]. Light mode keeps the paper navband;
   dark mode turns it into a frosted ink band over the ink page. */
const bandInk = 'var(--text-primary)';
const bandInkFaint = 'var(--text-secondary)';
const bandHairline = 'var(--line)';
const bandAccent = 'var(--red-bright)';
/* Parchment gold — the warm tan plate that marks hovered/active selectors */
const bandHighlight = '#e0ccaa';
/* Live green — the only place the site allows a status color */
const liveGreen = '#2f7d4f';

const livePulse = keyframes({
  '0%': { boxShadow: `0 0 0 0 rgba(47, 125, 79, 0.45)` },
  '70%': { boxShadow: '0 0 0 6px rgba(47, 125, 79, 0)' },
  '100%': { boxShadow: '0 0 0 0 rgba(47, 125, 79, 0)' },
});

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
  letterSpacing: '0.06em',
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

/* ── Frosted parchment navband — sticky. Translucent warm glass: content
   ghosts through beneath it, it lifts on scroll, and the page keeps its
   continuity instead of being cut by an opaque slab. ── */

export const navband = style({
  position: 'sticky',
  top: 0,
  zIndex: 50,
  /* Near-opaque in dark mode: at 80% the ink bleeds into whatever scrolls
     beneath (light covers turn the frost into beige mud). */
  background: 'rgba(16, 19, 27, 0.97)',
  backdropFilter: 'blur(18px) saturate(150%)',
  WebkitBackdropFilter: 'blur(18px) saturate(150%)',
  borderTop: `1px solid ${bandHairline}`,
  borderBottom: `1px solid ${bandHairline}`,
  transition: 'box-shadow 280ms ease, background 280ms ease',
  selectors: {
    'html[data-theme="light"] &': {
      background: 'rgba(244, 242, 236, 0.8)',
    },
  },
});

export const navbandScrolled = style({
  background: '#10131b',
  boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55)',
  selectors: {
    'html[data-theme="light"] &': {
      background: 'rgba(250, 248, 242, 0.9)',
      boxShadow: '0 14px 36px rgba(20, 22, 29, 0.14)',
    },
  },
});

/* Reader routes: the band stays at the top of the document and scrolls away
   with it, so immersive pages keep their chrome to the reader's own toolbar. */
export const navbandStatic = style({
  position: 'static',
  zIndex: 'auto',
});

export const navbandInner = style({
  // Wider than the content layout: the band must hold 13 uppercase nav items
  // plus both flanks, and the flanks keep min-content width, so every pixel
  // of track pressure otherwise lands between the search/EN slot and HOME.
  maxWidth: '1680px',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
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
    'screen and (max-width: 1199px)': {
      display: 'none',
    },
  },
});

export const navRow = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  justifyContent: 'center',
  overflowX: 'visible',
  overflowY: 'visible',
  scrollbarWidth: 'none',
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
});

/* The sliding plate — one soft pill that glides between items and rests on
   the active page. Gold-tinted on the parchment band; on the dark band the
   gold turns to mud, so it becomes a faint crimson wash under the crimson
   label instead. */
export const navIndicator = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '0',
  height: '0',
  borderRadius: '2px',
  background: 'rgba(224, 204, 170, 0.5)',
  opacity: 0,
  pointerEvents: 'none',
  transition: 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1), width 360ms cubic-bezier(0.22, 1, 0.36, 1), height 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, background-color 280ms ease',
  selectors: {
    'html:not([data-theme="light"]) &': {
      background: 'rgba(193, 23, 48, 0.18)',
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'none',
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
  minHeight: '40px',
  padding: '0 5px',
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: bandInk,
  whiteSpace: 'nowrap',
  transition: 'color 180ms ease',
  '@media': {
    'screen and (max-width: 1599px)': {
      fontSize: '9px',
      letterSpacing: '0.06em',
      padding: '0 3px',
    },
  },
});

/* Idle links carry no plate — the sliding indicator handles highlight.
   Hover and focus tint the label crimson. */
export const navLinkIdle = style({
  selectors: {
    '&:hover, &:focus-visible': { color: bandAccent },
  },
});

/* The active page keeps a permanent crimson label; the plate rests under it. */
export const navLinkActive = style({
  color: bandAccent,
});

export const navLinkRestricted = style([navLinkIdle, {
  color: bandInk,
  selectors: {
    '&:hover': {
      color: bandAccent,
    },
  },
}]);

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
  minHeight: '40px',
  padding: '0 5px',
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: bandInk,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  '@media': {
    'screen and (max-width: 1599px)': {
      fontSize: '9px',
      letterSpacing: '0.06em',
      padding: '0 3px',
    },
  },
  selectors: {
    '&:hover, &:focus-visible': { color: bandAccent },
  },
});

export const dropdownTriggerActive = style({
  color: bandAccent,
});

export const dropdownMenu = style({
  position: 'absolute',
  left: 0,
  top: '100%',
  width: '250px',
  background: 'rgba(255, 255, 255, 0.94)',
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  border: `1px solid ${bandHairline}`,
  borderRadius: vars.radius.tiny,
  boxShadow: '0 18px 44px rgba(11, 13, 18, 0.28)',
  padding: `${vars.space.xxs} 0`,
  opacity: 0,
  visibility: 'hidden' as any,
  transition: 'opacity 180ms ease, visibility 180ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
  transform: 'translateY(-4px)',
  zIndex: 60,
  selectors: {
    [`${dropdownWrap}:hover &, ${dropdownWrap}:focus-within &`]: {
      opacity: 1,
      visibility: 'visible' as any,
      transform: 'translateY(0)',
    },
    'html:not([data-theme="light"]) &': {
      background: 'rgba(22, 25, 34, 0.97)',
      boxShadow: '0 18px 44px rgba(0, 0, 0, 0.55)',
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
      background: 'rgba(155, 16, 34, 0.06)',
      color: bandAccent,
    },
    'html:not([data-theme="light"]) &:hover': {
      background: 'rgba(193, 23, 48, 0.16)',
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

/* The printer's-mark slot, as a <button> that opens the search palette */
export const bandIconButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '34px',
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: bandInk,
  opacity: 0.65,
  transition: 'color 180ms ease, opacity 180ms ease',
  selectors: {
    '&:hover': {
      color: bandAccent,
      opacity: 1,
    },
    '&:focus-visible': {
      outline: `1px solid ${bandAccent}`,
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

/* ── Admin live-visitor badge — a pulsing dot + count in the navband ── */

export const liveBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  height: '34px',
  padding: '0 6px',
  fontFamily: vars.font.label,
  fontSize: '12.5px',
  fontWeight: 500,
  letterSpacing: '0.04em',
  fontVariantNumeric: 'tabular-nums',
  color: bandInkFaint,
  whiteSpace: 'nowrap',
});

export const liveDot = style({
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  background: liveGreen,
  animation: `${livePulse} 2.2s ease-out infinite`,
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
  color: bandInk,
  border: `1px solid ${bandHairline}`,
  background: 'transparent',
  borderRadius: vars.radius.tiny,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background 200ms ease, border-color 200ms ease',
  selectors: {
    '&:hover': {
      color: bandAccent,
      borderColor: bandAccent,
    },
  },
});

/* ── Mobile ── */

export const mobileMenuBtn = style([iconButton, {
  '@media': {
    'screen and (min-width: 1200px)': {
      display: 'none',
    },
  },
}]);

export const mobileOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: vars.color.background,
  paddingTop: 'env(safe-area-inset-top, 0px)',
  overflowY: 'auto',
  '@media': {
    'screen and (min-width: 1200px)': {
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

globalStyle(`.${navbandInner}`, {
  '@media': {
    'screen and (max-width: 1199px)': {
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      columnGap: '8px',
      minHeight: '56px',
      padding: '4px max(12px, env(safe-area-inset-right)) 4px max(12px, env(safe-area-inset-left))',
    },
  },
});
const mobile = (className, rules) => globalStyle(`.${className}`, {
  '@media': { 'screen and (max-width: 1199px)': rules },
});
mobile(bandSlot, { minWidth: 0, gap: '8px' });
mobile(bandIconButton, { width: '44px', height: '44px', flexShrink: 0 });
mobile(iconButton, { width: '44px', height: '44px', flexShrink: 0 });
mobile(loginButton, { minHeight: '44px', padding: '10px 16px', letterSpacing: '0.12em' });
mobile(mobileInner, { padding: '16px max(16px, env(safe-area-inset-right)) max(32px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))' });
mobile(mobileNavStack, { gap: '4px', padding: '12px 0' });
mobile(mobileLink, { minHeight: '48px', gap: '8px', flexWrap: 'wrap', letterSpacing: '0.12em', overflowWrap: 'anywhere' });
mobile(mobileComingSoon, { marginLeft: 'auto', fontSize: '9px' });
mobile(mobileSubLink, { minHeight: '44px', padding: '8px 0' });
globalStyle(`.${masthead}`, { '@media': { 'screen and (max-width: 768px)': { padding: '18px 16px 14px' } } });
globalStyle(`.${mastheadWord}`, { '@media': { 'screen and (max-width: 768px)': { fontSize: '26px', letterSpacing: '0.06em' } } });
globalStyle(`.${bandMark}`, { '@media': { 'screen and (max-width: 400px)': { display: 'none' } } });

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

/* Admin & editorial triggers leave the desktop band on narrower screens —
   they remain available in the mobile overlay menu. */
export const navExtra = style({
  '@media': {
    'screen and (max-width: 1599px)': {
      display: 'none',
    },
  },
});
