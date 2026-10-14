import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

/* ─────────────────────────────────────────────────────────────────────────────
   Digital Library — archival catalog layout.
   Hero band, sticky filter rail (which becomes a bottom sheet on mobile),
   search/sort toolbar, 3-column grid of emblem covers or a dense index table.
   Gold accents follow the global --sand token so light mode adapts.
   ───────────────────────────────────────────────────────────────────────────── */

const gold = 'var(--sand, #9a8569)';
const cream = '#f5f0e6';
const mobile = 'screen and (max-width: 780px)';
const hoverable = '(hover: hover) and (pointer: fine)';

/* ── Hero ── */

export const page = style({
  minHeight: '100vh',
  background: vars.color.background,
  color: vars.color.text,
});

export const hero = style({
  padding: '32px 0 24px',
  '@media': {
    [mobile]: { padding: '12px 0 10px' },
  },
});

export const heroInner = style({
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '0 clamp(16px, 3vw, 32px)',
  '@media': {
    [mobile]: { padding: '0 18px' },
  },
});

export const eyebrow = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '9.5px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: vars.color.accentHover,
});

export const heroRow = style({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: vars.space.lg,
  marginTop: '6px',
  '@media': {
    [mobile]: { alignItems: 'center', marginTop: 0, flexWrap: 'wrap' },
  },
});

export const heroTitle = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: 'clamp(34px, 3.6vw, 50px)',
  fontWeight: 600,
  lineHeight: 1,
  letterSpacing: '-0.01em',
  color: vars.color.text,
  '@media': {
    [mobile]: { fontSize: '26px', lineHeight: 1.05 },
  },
});

export const heroUnderline = style({
  width: '52px',
  height: '3px',
  marginTop: '14px',
  background: vars.color.accent,
  /* Hand-ruled, not machine-straight. */
  transform: 'rotate(-0.6deg)',
  '@media': {
    [mobile]: { width: '30px', height: '2px', marginTop: '8px' },
  },
});

export const heroMeta = style({
  margin: '10px 0 0',
  fontFamily: vars.font.label,
  fontSize: '9.5px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
  '@media': {
    [mobile]: { margin: '6px 0 0', lineHeight: 1.4, fontSize: '7.5px', letterSpacing: '0.08em' },
  },
});

export const localLists = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minHeight: '40px',
  padding: '11px 15px',
  border: `1px solid ${vars.color.borderStrong}`,
  borderRadius: '2px',
  background: 'transparent',
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '9.5px',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'border-color 160ms ease, color 160ms ease',
  selectors: {
    '&:hover': { borderColor: vars.color.accentHover, color: vars.color.text },
  },
  '@media': {
    [mobile]: { width: '44px', height: '44px', minHeight: 0, padding: 0, flex: 'none' },
  },
});

export const localListsLabel = style({
  '@media': {
    [mobile]: { display: 'none' },
  },
});

/* ── Layout shell ── */

export const layout = style({
  display: 'flex',
  gap: '30px',
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '30px clamp(16px, 3vw, 32px) 48px',
  '@media': {
    [mobile]: { display: 'block', padding: '10px 16px 40px' },
  },
});

export const sheetOverlay = style({
  position: 'fixed',
  inset: 0,
  background: 'rgba(6, 5, 4, 0.72)',
  opacity: 0,
  pointerEvents: 'none',
  transition: 'opacity 250ms ease',
  zIndex: 40,
  selectors: {
    '&.open': { opacity: 1, pointerEvents: 'auto' },
  },
  '@media': {
    [mobile]: { display: 'block' },
  },
});

/* The rail: sticky sidebar on desktop, fixed bottom sheet on mobile. */
export const side = style({
  width: '248px',
  flex: 'none',
  alignSelf: 'flex-start',
  position: 'sticky',
  top: '24px',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.surface,
  border: vars.border.strong,
  borderRadius: '6px',
  padding: '22px 20px',
  '@media': {
    [mobile]: {
      position: 'fixed',
      inset: 'auto 0 0 0',
      top: 'auto',
      width: 'auto',
      maxHeight: '82vh',
      /* dvh tracks the collapsing URL bar where supported */
      maxHeight: '82dvh',
      overflow: 'visible',
      overscrollBehavior: 'contain',
      borderTopLeftRadius: '18px',
      borderTopRightRadius: '18px',
      boxShadow: vars.shadow.panel,
      zIndex: 41,
      transform: 'translateY(100%)',
      transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
    },
  },
});

export const sideOpen = style({});

globalStyle(`.${sideOpen}`, {
  '@media': {
    [mobile]: { transform: 'translateY(0)' },
  },
});

globalStyle('body.dl-sheet-open', { overflow: 'hidden' });

/* Sheet chrome — only painted on mobile. */
export const sheetHandle = style({
  width: '36px',
  height: '4px',
  margin: '12px auto 14px',
  flex: 'none',
  borderRadius: '4px',
  background: vars.color.borderStrong,
  display: 'none',
  '@media': {
    [mobile]: { display: 'block' },
  },
});

export const sheetHead = style({
  display: 'none',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 20px 14px',
  borderBottom: vars.border.strong,
  marginBottom: '16px',
  flex: 'none',
  '@media': {
    [mobile]: { display: 'flex' },
  },
});

export const sheetTitle = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '19px',
  fontWeight: 600,
  color: vars.color.text,
});

export const sheetClose = style({
  position: 'relative',
  width: '28px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: vars.border.strong,
  background: 'transparent',
  color: vars.color.textMuted,
  cursor: 'pointer',
  selectors: {
    /* 44px hit area around the compact visual disc */
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: '-8px',
    },
  },
});

export const sideScroll = style({
  '@media': {
    [mobile]: {
      padding: '0 20px',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      flex: 1,
      minHeight: 0,
      WebkitOverflowScrolling: 'touch',
    },
  },
});

/* Blocks that exist only inside the mobile sheet (sort chips, search mode). */
export const mobileOnly = style({});

globalStyle(`.${mobileOnly}`, { display: 'none' });

globalStyle(`.${mobileOnly}`, {
  '@media': {
    [mobile]: { display: 'block' },
  },
});

export const sheetSortBlock = style({
  marginBottom: '18px',
  paddingBottom: '16px',
  borderBottom: vars.border.strong,
});

export const sheetSortChips = style({
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
});

export const sortChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '44px',
  padding: '8px 14px',
  borderRadius: '20px',
  border: vars.border.strong,
  background: 'transparent',
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.04em',
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'color 140ms ease, border-color 140ms ease, background-color 140ms ease',
  selectors: {
    '&:hover': { color: vars.color.text },
  },
});

export const sortChipOn = style({
  background: vars.color.accentSoft,
  borderColor: vars.color.accentHover,
  color: vars.color.text,
  selectors: {
    '&:hover': { color: vars.color.text },
  },
});

export const sheetModeRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '18px',
  paddingBottom: '16px',
  borderBottom: vars.border.strong,
});

export const sheetModeSelect = style({
  width: '100%',
  fontSize: '16px',
  letterSpacing: '0.02em',
});

export const sideHeading = style({
  display: 'block',
  margin: '0 0 12px',
  fontFamily: vars.font.label,
  fontSize: '9.5px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const catRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '9px 8px',
  borderRadius: '4px',
  border: 'none',
  background: 'transparent',
  fontFamily: vars.font.label,
  fontSize: '11.5px',
  color: vars.color.textMuted,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background-color 140ms ease, color 140ms ease',
  selectors: {
    '&:hover': { color: vars.color.text },
  },
  '@media': {
    [mobile]: { fontSize: '12.5px', padding: '12px 0', gap: '11px' },
  },
});

export const catRowOn = style({
  background: vars.color.accentSoft,
  color: vars.color.text,
  selectors: {
    '&:hover': { color: vars.color.text },
  },
});

globalStyle(`.${catRowOn} svg`, {
  stroke: vars.color.accentHover,
});

export const catIcon = style({ flex: 'none' });

export const catLabel = style({ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });

export const catCount = style({
  fontFamily: vars.font.label,
  fontSize: '9.5px',
  color: vars.color.textFaint,
  '@media': {
    [mobile]: { fontSize: '10px' },
  },
});

export const divider = style({
  height: '1px',
  margin: '18px 0',
  background: vars.color.borderStrong,
  flex: 'none',
});

/* ── Era range slider ── */

export const rangeValues = style({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '8px',
  fontFamily: vars.font.label,
  fontSize: '10.5px',
  color: vars.color.textMuted,
});

export const rangeField = style({
  position: 'relative',
  height: '20px',
});

export const rangeTrack = style({
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: '3px',
  transform: 'translateY(-50%)',
  borderRadius: '3px',
  background: vars.color.borderStrong,
});

export const rangeFill = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  borderRadius: '3px',
  background: vars.color.accent,
});

export const rangeHandle = style({
  position: 'absolute',
  top: '50%',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: vars.color.text,
  border: `2px solid ${vars.color.surface}`,
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
});

export const rangeInput = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  opacity: 0,
  appearance: 'none',
  WebkitAppearance: 'none',
  background: 'transparent',
  pointerEvents: 'none',
  cursor: 'pointer',
  selectors: {
    '&::-webkit-slider-thumb': {
      WebkitAppearance: 'none',
      appearance: 'none',
      width: '16px',
      height: '20px',
      pointerEvents: 'auto',
    },
    '&::-moz-range-thumb': {
      width: '16px',
      height: '20px',
      border: 'none',
      borderRadius: 0,
      background: 'transparent',
      pointerEvents: 'auto',
    },
  },
});

export const rangeTicks = style({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '2px 2px 0',
  fontFamily: vars.font.label,
  fontSize: '8px',
  color: vars.color.textFaint,
});

/* ── Format / language checkbox rows ── */

export const fmtRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '7.5px 2px',
  border: 'none',
  background: 'transparent',
  fontFamily: vars.font.label,
  fontSize: '11.5px',
  color: vars.color.textMuted,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'color 140ms ease',
  selectors: {
    '&:hover': { color: vars.color.text },
  },
  '@media': {
    [mobile]: { fontSize: '12.5px', padding: '12px 0' },
  },
});

export const fmtRowOn = style({ color: vars.color.text });

export const fmtLabelText = style({ display: 'flex', alignItems: 'center' });

export const fmtBox = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '13px',
  height: '13px',
  marginRight: '9px',
  borderRadius: '3px',
  border: `1px solid ${vars.color.borderStrong}`,
  color: cream,
});

export const fmtBoxOn = style({
  background: vars.color.accent,
  borderColor: vars.color.accent,
});

export const fmtCount = style({
  fontFamily: vars.font.label,
  fontSize: '9.5px',
  color: vars.color.textFaint,
});

export const clearLink = style({
  marginTop: '18px',
  border: 'none',
  background: 'transparent',
  padding: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.06em',
  color: vars.color.textFaint,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  cursor: 'pointer',
  textAlign: 'left',
  selectors: {
    '&:hover': { color: vars.color.textMuted },
  },
  '@media': {
    [mobile]: { display: 'none' },
  },
});

export const sheetFooter = style({
  display: 'none',
  alignItems: 'center',
  gap: vars.space.md,
  padding: '16px 20px',
  paddingBottom: '16px',
  borderTop: vars.border.strong,
  flex: 'none',
  '@media': {
    [mobile]: {
      display: 'flex',
      /* Keep the CTA clear of the home indicator */
      paddingBottom: '16px',
      paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
    },
  },
});

export const sheetClear = style({
  border: 'none',
  background: 'transparent',
  padding: 0,
  fontFamily: vars.font.label,
  fontSize: '10.5px',
  letterSpacing: '0.05em',
  color: vars.color.textFaint,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
});

export const sheetCta = style({
  flex: 1,
  textAlign: 'center',
  padding: '14px',
  borderRadius: '5px',
  border: 'none',
  background: vars.color.accent,
  color: cream,
  fontFamily: vars.font.label,
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': { background: vars.color.accentHover },
  },
});

/* ── Main column ── */

export const main = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
});

export const topbarRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '18px',
  '@media': {
    [mobile]: { flexWrap: 'wrap', marginBottom: '12px' },
  },
});

/* Toolbar controls that only exist on desktop (mobile gets its own row). */
export const desktopOnly = style({});

globalStyle(`.${desktopOnly}`, {
  '@media': {
    [mobile]: { display: 'none' },
  },
});

export const searchBox = style({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  minHeight: '42px',
  padding: '0 15px',
  background: vars.color.surface,
  border: vars.border.strong,
  borderRadius: '5px',
  color: vars.color.textFaint,
  '@media': {
    [mobile]: { flexBasis: '100%', minHeight: '44px', marginBottom: 0, fontSize: '12px' },
  },
});

export const searchIcon = style({ flex: 'none', display: 'flex' });

export const searchInput = style({
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  padding: 0,
  fontFamily: vars.font.label,
  fontSize: '11.5px',
  color: vars.color.text,
  selectors: {
    '&::placeholder': { color: vars.color.textFaint },
    '&:focus': { outline: 'none' },
  },
  '@media': {
    [mobile]: { fontSize: '16px' },
  },
});

export const selectWrap = style({
  position: 'relative',
  flex: 'none',
});

export const selectControl = style({
  appearance: 'none',
  WebkitAppearance: 'none',
  minHeight: '44px',
  padding: '12px 32px 12px 15px',
  borderRadius: '5px',
  border: vars.border.strong,
  background: vars.color.surface,
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  selectors: {
    '&:focus': { outline: 'none', borderColor: vars.color.accentHover },
  },
  '@media': {
    /* 16px stops iOS Safari zooming the page when the control is focused */
    [mobile]: { fontSize: '16px', letterSpacing: '0.02em' },
  },
});

globalStyle(`${selectControl} option`, {
  background: vars.color.surface,
  color: vars.color.text,
});

export const selectChevron = style({
  position: 'absolute',
  top: '50%',
  right: '10px',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  color: vars.color.textMuted,
  display: 'flex',
});

export const viewToggle = style({
  display: 'flex',
  gap: '6px',
  flex: 'none',
});

export const viewBtn = style({
  width: '42px',
  height: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '5px',
  border: vars.border.strong,
  background: 'transparent',
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'background-color 180ms ease, border-color 180ms ease, color 180ms ease',
  selectors: {
    '&:hover': { color: vars.color.text },
  },
});

export const viewBtnActive = style({
  background: vars.color.accent,
  borderColor: vars.color.accent,
  color: cream,
  selectors: {
    '&:hover': { color: cream },
  },
});

/* Mobile toolbar row — Filters button + quick category chip scroller. */
export const mobileBtnRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '10px',
});

export const mobileFilterBtn = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minHeight: '44px',
  padding: '0 14px',
  borderRadius: '22px',
  border: vars.border.strong,
  background: 'transparent',
  fontFamily: vars.font.label,
  fontSize: '10.5px',
  letterSpacing: '0.05em',
  color: vars.color.text,
  cursor: 'pointer',
  flex: 'none',
});

export const mobileBadge = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: vars.color.accent,
  color: cream,
  fontFamily: vars.font.label,
  fontSize: '8.5px',
  fontWeight: 600,
});

export const catChips = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: 1,
  minWidth: 0,
  overflowX: 'auto',
  overscrollBehaviorX: 'contain',
  scrollSnapType: 'x proximity',
  scrollbarWidth: 'none',
  selectors: {
    '&::-webkit-scrollbar': { display: 'none' },
  },
  position: 'relative',
});

/* Right-edge fade hints there are more chips off-screen (see chips below). */
export const chipsFade = style({});

export const catChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '44px',
  padding: '8px 14px',
  borderRadius: '22px',
  border: vars.border.strong,
  background: 'transparent',
  fontFamily: vars.font.label,
  fontSize: '10.5px',
  letterSpacing: '0.05em',
  color: vars.color.textMuted,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  flex: 'none',
  scrollSnapAlign: 'start',
  transition: 'color 140ms ease, border-color 140ms ease, background-color 140ms ease',
  selectors: {
    '&:hover': { color: vars.color.text },
  },
});

export const catChipOn = style({
  background: vars.color.accentSoft,
  borderColor: vars.color.accentHover,
  color: vars.color.text,
  selectors: {
    '&:hover': { color: vars.color.text },
  },
});

/* ── Active filter chips ── */

export const breadRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '10px',
  marginBottom: '22px',
  '@media': {
    [mobile]: { flexDirection: 'column', alignItems: 'stretch', marginBottom: '16px' },
  },
});

export const chips = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px',
  '@media': {
    [mobile]: {
      flexWrap: 'nowrap',
      overflowX: 'auto',
      overscrollBehaviorX: 'contain',
      scrollSnapType: 'x proximity',
      paddingBottom: '2px',
    },
  },
});

globalStyle(`.${catChips}.${chipsFade}::after, .${chips}.${chipsFade}::after`, {
  content: '""',
  position: 'sticky',
  right: 0,
  top: 0,
  bottom: 0,
  flex: 'none',
  width: '28px',
  marginLeft: '-28px',
  background: `linear-gradient(to left, ${vars.color.background}, transparent)`,
  pointerEvents: 'none',
});

export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 12px',
  borderRadius: '20px',
  background: vars.color.accentSoft,
  border: `1px solid ${vars.color.accentHover}`,
  color: vars.color.text,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
});

export const chipX = style({
  display: 'flex',
  alignItems: 'center',
  border: 'none',
  background: 'transparent',
  padding: 0,
  color: vars.color.textMuted,
  cursor: 'pointer',
  selectors: {
    '&:hover': { color: vars.color.text },
  },
});

export const chipClear = style({
  border: 'none',
  background: 'transparent',
  padding: 0,
  fontFamily: vars.font.label,
  fontSize: '9.5px',
  letterSpacing: '0.05em',
  color: vars.color.textFaint,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover': { color: vars.color.textMuted },
  },
});

export const countTxt = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  '@media': {
    [mobile]: { fontSize: '9px', marginBottom: '8px' },
  },
});

export const uploadAction = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  minHeight: '32px',
  padding: '0 12px',
  borderRadius: '3px',
  border: vars.border.strong,
  background: 'transparent',
  fontFamily: vars.font.label,
  fontSize: '9px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
  whiteSpace: 'nowrap',
  transition: 'border-color 160ms ease, color 160ms ease',
  selectors: {
    '&:hover': { borderColor: vars.color.accentHover, color: vars.color.accentHover },
  },
});

/* ── Grid cards ── */

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '20px',
  '@media': {
    'screen and (max-width: 1100px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    [mobile]: { display: 'flex', flexDirection: 'column', gap: 0 },
  },
});

export const card = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.surface,
  border: vars.border.strong,
  borderRadius: '6px',
  overflow: 'hidden',
  /* Each card sits at its own seeded tilt, like volumes shelved by hand;
     picking one up (hover) squares it. */
  transform: 'rotate(var(--dl-tilt, 0deg)) translateY(var(--dl-lift, 0px))',
  transition:
    'transform 250ms cubic-bezier(0.2, 0.7, 0.3, 1), border-color 250ms ease, box-shadow 250ms ease',
  '@media': {
    [hoverable]: {
      selectors: {
        '&:hover': {
          transform: 'translateY(-6px) rotate(0deg)',
          borderColor: gold,
          boxShadow: vars.shadow.panel,
        },
      },
    },
    [mobile]: {
      transform: 'none',
      borderRadius: 0,
      border: 'none',
      borderBottom: vars.border.strong,
      background: 'transparent',
      transition: 'background-color 180ms ease',
      /* Long "Load more" lists stay cheap: off-screen rows skip layout/paint
         while staying in the DOM for find-in-page and screen readers. */
      contentVisibility: 'auto',
      containIntrinsicSize: 'auto 104px',
    },
  },
});

globalStyle(`.${card}:active`, {
  '@media': {
    [mobile]: { background: vars.color.surface },
  },
});

export const cardLink = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
  color: 'inherit',
  textAlign: 'left',
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  '@media': {
    [mobile]: { flexDirection: 'row', alignItems: 'flex-start', gap: '13px', padding: '13px 0' },
  },
});

export const cover = style({
  position: 'relative',
  height: '150px',
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  background: `radial-gradient(circle at 50% 40%, ${vars.color.surfaceSoft}, ${vars.color.surfaceRaised} 70%)`,
  borderBottom: vars.border.strong,
  selectors: {
    /* Paper-fiber grain over every cover — printed plates, not flat fills. */
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      opacity: 0.07,
      mixBlendMode: 'overlay',
      pointerEvents: 'none',
    },
  },
  '@media': {
    [mobile]: {
      width: '72px',
      height: '72px',
      borderRadius: '4px',
      border: vars.border.strong,
      borderBottom: vars.border.strong,
    },
  },
});

/* Seeded paper tints — barely different grounds so the grid doesn't read as
   one photocopied sheet. */
export const coverTintA = style({});

export const coverTintB = style({
  background: `radial-gradient(circle at 50% 38%, color-mix(in srgb, ${gold} 7%, ${vars.color.surfaceSoft}), ${vars.color.surfaceRaised} 74%)`,
});

export const coverTintC = style({
  background: `radial-gradient(circle at 50% 44%, ${vars.color.surfaceSoft}, color-mix(in srgb, ${vars.color.surfaceRaised} 86%, #05070c) 68%)`,
});

export const coverImg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const coverRing = style({
  position: 'absolute',
  width: '110px',
  height: '110px',
  borderRadius: '50%',
  border: `1px solid color-mix(in srgb, ${gold} 32%, transparent)`,
  '@media': {
    [mobile]: { display: 'none' },
  },
});

export const coverRing2 = style({
  position: 'absolute',
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  border: `1px solid color-mix(in srgb, ${gold} 24%, transparent)`,
  '@media': {
    [mobile]: { display: 'none' },
  },
});

export const coverRing3 = style({
  position: 'absolute',
  width: '58px',
  height: '58px',
  borderRadius: '50%',
  border: `1px solid color-mix(in srgb, ${gold} 16%, transparent)`,
  '@media': {
    [mobile]: { display: 'none' },
  },
});

/* Some covers get their inner ring as a dotted engraving guide. */
export const ringDashed = style({
  borderStyle: 'dashed',
});

export const emblem = style({
  position: 'relative',
  width: '52px',
  height: '52px',
  color: gold,
  '@media': {
    [mobile]: { width: '34px', height: '34px' },
  },
});

globalStyle(`.${emblem} svg`, {
  display: 'block',
  width: '100%',
  height: '100%',
});

export const fmtTag = style({
  position: 'absolute',
  top: '10px',
  right: '10px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '3px 7px',
  borderRadius: '3px',
  border: `1px solid color-mix(in srgb, ${gold} 50%, transparent)`,
  background: 'rgba(11, 13, 18, 0.75)',
  color: gold,
  fontFamily: vars.font.label,
  fontSize: '7.5px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  /* Stamped, not pasted — a hair off the horizontal. */
  transform: 'rotate(-1.2deg)',
  '@media': {
    [mobile]: { display: 'none' },
  },
});

export const adminActions = style({
  position: 'absolute',
  top: '8px',
  right: '8px',
  zIndex: 2,
  display: 'flex',
  gap: '6px',
  opacity: 0,
  transition: 'opacity 180ms ease',
});

globalStyle(`.${card}:hover .${adminActions}`, {
  '@media': {
    [hoverable]: { opacity: 1 },
  },
});

globalStyle(`.${adminActions}`, {
  '@media': {
    '(hover: none)': { opacity: 1 },
  },
});

export const adminBtn = style({
  width: '30px',
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(0, 0, 0, 0.62)',
  color: vars.color.textMuted,
  cursor: 'pointer',
  selectors: {
    '&:hover': { color: vars.color.accentHover },
  },
});

export const cardBody = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
  padding: '16px 17px 18px',
  '@media': {
    [mobile]: { padding: 0 },
  },
});

export const cardTitle = style({
  margin: '0 0 6px',
  fontFamily: vars.font.display,
  fontSize: '18px',
  fontWeight: 600,
  lineHeight: 1.28,
  color: vars.color.text,
  minHeight: '46px',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  '@media': {
    [mobile]: { fontSize: '15px', minHeight: 0, lineHeight: 1.25, marginBottom: '4px' },
  },
});

export const cardAuth = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '9.5px',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
});

export const cardMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '5px',
});

export const cardEra = style({
  fontFamily: vars.font.label,
  fontSize: '9px',
  color: vars.color.textFaint,
});

export const fmtChipMobile = style({
  display: 'none',
  alignItems: 'center',
  gap: '3px',
  padding: '2px 6px',
  borderRadius: '3px',
  border: `1px solid color-mix(in srgb, ${gold} 50%, transparent)`,
  color: gold,
  fontFamily: vars.font.label,
  fontSize: '7.5px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  '@media': {
    [mobile]: { display: 'inline-flex' },
  },
});

/* Card actions reveal on hover (desktop pointer); on mobile the whole row
   opens the book and secondary actions live on the book page. */
export const cardActions = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '6px',
  margin: '12px 17px 16px',
  marginTop: 'auto',
  paddingTop: '12px',
  opacity: 0,
  transition: 'opacity 180ms ease',
  '@media': {
    [mobile]: { display: 'none' },
  },
});

/* Trailing chevron — the mobile "this row opens" affordance. */
export const rowChevron = style({
  display: 'none',
  '@media': {
    [mobile]: { display: 'flex', alignItems: 'center', flex: 'none', color: vars.color.textFaint },
  },
});

globalStyle(`.${cardActions}`, {
  '@media': {
    '(hover: none)': { opacity: 1 },
  },
});

export const actionRead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  flex: 1,
  minHeight: '44px',
  padding: '8px 12px',
  borderRadius: '3px',
  border: `1px solid ${vars.color.accent}`,
  background: vars.color.accent,
  color: cream,
  fontFamily: vars.font.label,
  fontSize: '8.5px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background-color 160ms ease, border-color 160ms ease',
  selectors: {
    '&:hover': { background: vars.color.accentHover, borderColor: vars.color.accentHover },
  },
});

export const actionPdf = style({
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  minHeight: '44px',
  padding: '8px 10px',
  borderRadius: '3px',
  border: vars.border.strong,
  background: 'transparent',
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '8.5px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'border-color 160ms ease, color 160ms ease',
  selectors: {
    '&:hover': { borderColor: vars.color.accentHover, color: vars.color.accentHover },
  },
});

/* ── Dense list view ── */

export const listview = style({
  display: 'block',
});

export const lvHead = style({
  display: 'grid',
  gridTemplateColumns: '1fr 190px 70px 90px 26px',
  gap: '16px',
  padding: '0 6px 10px',
  borderBottom: vars.border.strong,
  fontFamily: vars.font.label,
  fontSize: '8.5px',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const lvRow = style({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '1fr 190px 70px 90px 26px',
  gap: '16px',
  alignItems: 'center',
  padding: '13px 6px',
  borderBottom: vars.border.strong,
  color: 'inherit',
  transition: 'background-color 180ms ease',
  selectors: {
    '&:hover': { background: vars.color.surface },
  },
});

globalStyle(`${lvHead}, ${lvRow}`, {
  '@media': {
    'screen and (max-width: 900px)': {
      gridTemplateColumns: '1fr 70px 90px 26px',
    },
  },
});

export const lvCatCol = style({
  '@media': {
    'screen and (max-width: 900px)': { display: 'none' },
  },
});

export const lvTitle = style({
  fontFamily: vars.font.display,
  fontSize: '16px',
  fontWeight: 600,
  color: vars.color.text,
  overflowWrap: 'anywhere',
});

export const lvAuth = style({
  marginTop: '3px',
  fontFamily: vars.font.label,
  fontSize: '10px',
  color: vars.color.textFaint,
});

export const lvCat = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  color: vars.color.textMuted,
});

export const lvEra = style({
  fontFamily: vars.font.label,
  fontSize: '11px',
  color: vars.color.textFaint,
});

export const lvArrow = style({
  justifySelf: 'end',
  color: vars.color.textFaint,
});

globalStyle(`.${lvRow}:hover .${lvArrow}`, {
  color: vars.color.accentHover,
});

/* ── Pagination ── */

export const pagerow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '14px',
  marginTop: '28px',
  paddingTop: '20px',
  borderTop: vars.border.strong,
});

export const pageInfo = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  color: vars.color.textFaint,
});

export const pages = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

export const pageBtn = style({
  minWidth: '32px',
  height: '32px',
  padding: '0 6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
  border: vars.border.strong,
  background: 'transparent',
  fontFamily: vars.font.label,
  fontSize: '11px',
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease',
  selectors: {
    '&:hover': { color: vars.color.text },
    '&:disabled': { opacity: 0.35, cursor: 'default', pointerEvents: 'none' },
  },
});

export const pageBtnActive = style({
  background: vars.color.accent,
  borderColor: vars.color.accent,
  color: cream,
  selectors: {
    '&:hover': { color: cream },
  },
});

export const pageEllipsis = style({
  minWidth: '20px',
  textAlign: 'center',
  fontFamily: vars.font.label,
  fontSize: '11px',
  color: vars.color.textFaint,
});

export const loadMore = style({
  width: '100%',
  marginTop: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minHeight: '44px',
  borderRadius: '5px',
  border: vars.border.strong,
  background: 'transparent',
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: vars.color.text,
  cursor: 'pointer',
});

/* ── Misc ── */

export const stateLine = style({
  padding: `${vars.space.xl} ${vars.space.md}`,
  textAlign: 'center',
  color: vars.color.textMuted,
});

export const stateLineError = style({
  padding: `${vars.space.xl} ${vars.space.md}`,
  textAlign: 'center',
  color: vars.color.accentHover,
});

// Allow the experimental title to wrap on narrow library layouts.
export const experimentalReaderLink = style([uploadAction, {
  whiteSpace: 'normal',
  maxWidth: '100%',
  lineHeight: 1.6,
  padding: '6px 12px',
}]);
