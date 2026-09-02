import { style, keyframes } from '@vanilla-extract/css';
import { vars } from '../../styles/obsidianTheme.css.ts';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  minHeight: '360px',
});

/* ── Mode switch (Flat / Satellite) + hints ── */

export const modeRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space.md,
});

export const modeSwitch = style({
  display: 'inline-flex',
  border: vars.border.subtle,
  background: vars.color.surface,
  overflow: 'hidden',
});

export const modeBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  minHeight: '36px',
  padding: `0 ${vars.space.md}`,
  border: 'none',
  background: 'transparent',
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 140ms ease',
  selectors: {
    '&:hover:not(:disabled)': { color: vars.color.text, background: vars.color.surfaceSoft },
    '&:disabled': { opacity: 0.35, cursor: 'not-allowed' },
  },
});

export const modeBtnActive = style({
  background: vars.color.accent,
  color: '#ffffff',
  selectors: {
    '&:hover:not(:disabled)': { background: vars.color.accentHover, color: '#ffffff' },
  },
});

export const modeHint = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: vars.color.textFaint,
});

/* ── Time slider ── */

export const timeRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: `${vars.space.xs} 0`,
});

export const timeLabel = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.22em',
  color: vars.color.textFaint,
  whiteSpace: 'nowrap',
});

export const timeYear = style({
  fontFamily: vars.font.display,
  fontSize: '20px',
  fontWeight: 500,
  color: vars.color.text,
  fontVariantNumeric: 'tabular-nums',
  minWidth: '64px',
  textAlign: 'right',
});

export const timeSlider = style({
  flex: 1,
  appearance: 'none',
  height: '2px',
  background: vars.color.borderStrong,
  cursor: 'pointer',
  selectors: {
    '&::-webkit-slider-thumb': {
      appearance: 'none',
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      background: vars.color.accent,
      border: 'none',
    },
    '&::-moz-range-thumb': {
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      background: vars.color.accent,
      border: 'none',
    },
    '&:focus': { outline: 'none' },
  },
});

export const playBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  border: vars.border.subtle,
  background: vars.color.surface,
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'all 140ms ease',
  selectors: {
    '&:hover': { background: vars.color.surfaceSoft, color: vars.color.text },
  },
});

/* ── Category legend ── */

export const legend = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
});

export const legendItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  minHeight: '28px',
  padding: `0 ${vars.space.sm}`,
  border: vars.border.subtle,
  background: vars.color.surface,
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.06em',
  color: vars.color.textMuted,
  cursor: 'pointer',
  transition: 'all 140ms ease',
  selectors: {
    '&:hover': { borderColor: vars.color.borderStrong, color: vars.color.text },
  },
});

export const legendItemDisabled = style({
  opacity: 0.4,
  selectors: {
    '&:hover': { opacity: 0.7 },
  },
});

export const legendDot = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  flexShrink: 0,
});

export const countNote = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: vars.color.textFaint,
  fontVariantNumeric: 'tabular-nums',
});

/* ── Map/panel layout ── */

export const contentGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: vars.space.md,
  '@media': {
    'screen and (min-width: 1024px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 300px',
      alignItems: 'start',
    },
  },
});

export const mapFrame = style({
  position: 'relative',
  border: vars.border.subtle,
  background: '#08090d',
  overflow: 'hidden',
});

export const sidePanel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  minWidth: 0,
});

export const detailCard = style({
  border: vars.border.subtle,
  background: vars.color.surface,
  padding: vars.space.md,
});

export const detailCategory = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.22em',
  marginBottom: vars.space.xxs,
});

export const detailTitle = style({
  fontFamily: vars.font.display,
  fontSize: '22px',
  fontWeight: 500,
  lineHeight: 1.15,
  color: vars.color.text,
});

export const detailYear = style({
  fontFamily: vars.font.label,
  fontSize: '13px',
  color: vars.color.textFaint,
  marginLeft: vars.space.xs,
});

export const detailDesc = style({
  margin: `${vars.space.xs} 0 0`,
  fontSize: '13px',
  lineHeight: 1.7,
  fontFamily: vars.font.body,
  color: vars.color.textMuted,
});

export const detailCountry = style({
  marginTop: vars.space.sm,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: vars.color.accentHover,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  selectors: {
    '&:hover': { textDecoration: 'underline' },
  },
});

/* ── Country stats panel ── */

export const statsPanel = style({
  border: vars.border.subtle,
  background: vars.color.surface,
  padding: vars.space.md,
});

export const statsHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: vars.space.sm,
  marginBottom: vars.space.sm,
});

export const statsTitle = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '22px',
  fontWeight: 500,
  color: vars.color.text,
});

export const statsClose = style({
  background: 'none',
  border: 'none',
  padding: 0,
  color: vars.color.textFaint,
  cursor: 'pointer',
  transition: 'color 140ms ease',
  selectors: {
    '&:hover': { color: vars.color.text },
  },
});

export const statRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: vars.space.sm,
  padding: `${vars.space.xs} 0`,
  borderBottom: `1px solid ${vars.color.border}`,
  selectors: {
    '&:last-child': { borderBottom: 'none' },
  },
});

export const statName = style({
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
});

export const statVal = style({
  fontFamily: vars.font.display,
  fontSize: '17px',
  color: vars.color.text,
  fontVariantNumeric: 'tabular-nums',
});

export const statMeta = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  color: vars.color.textFaint,
  fontVariantNumeric: 'tabular-nums',
});

/* ── 2D map tooltip ── */

export const mapTooltip = style({
  position: 'fixed',
  zIndex: 60,
  pointerEvents: 'none',
  background: vars.color.overlay,
  border: vars.border.strong,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.06em',
  color: vars.color.textSoft,
  whiteSpace: 'nowrap',
});

/* ── Atlas frame, cartouche, vignette (19th-century plate grammar) ── */

export const atlasFrame = style({
  position: 'relative',
  background: '#0b0d12',
  border: '1px solid #262a35',
  overflow: 'hidden',
  selectors: {
    /* double-rule frame: inner hairline offset from the outer border */
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: '10px',
      border: '1px solid rgba(236, 233, 224, 0.10)',
      pointerEvents: 'none',
      zIndex: 4,
    },
  },
});

export const atlasVignette = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 3,
  background: 'radial-gradient(ellipse at center, transparent 42%, rgba(4, 5, 8, 0.55) 100%)',
});

export const cartouche = style({
  position: 'absolute',
  top: vars.space.md,
  left: vars.space.md,
  zIndex: 5,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: `${vars.space.sm} ${vars.space.md}`,
  border: '1px solid rgba(236, 233, 224, 0.14)',
  background: 'rgba(11, 13, 18, 0.72)',
  backdropFilter: 'blur(2px)',
});

/* 印章-style seal: the single crimson ornament on the map. */
export const seal = style({
  width: '34px',
  height: '34px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `2px solid ${vars.color.accent}`,
  background: 'rgba(179, 18, 46, 0.14)',
  transform: 'rotate(-4deg)',
  flexShrink: 0,
});

export const cartoucheKicker = style({
  fontFamily: vars.font.label,
  fontSize: '9px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.28em',
  color: vars.color.accentHover,
  marginBottom: vars.space.xxs,
});

export const cartoucheTitle = style({
  fontFamily: vars.font.display,
  fontSize: '22px',
  fontWeight: 500,
  lineHeight: 1.1,
  color: vars.color.text,
});

export const cartoucheRange = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.18em',
  color: vars.color.textMuted,
  marginTop: vars.space.xxs,
  fontVariantNumeric: 'tabular-nums',
});

export const atlasAttribution = style({
  position: 'absolute',
  bottom: '14px',
  right: vars.space.md,
  zIndex: 5,
  fontFamily: vars.font.label,
  fontSize: '9px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  opacity: 0.7,
});

/* SVG element styling — the map itself */

export const country = style({
  fill: '#191d26',
  stroke: '#3a4152',
  strokeWidth: 0.5,
  vectorEffect: 'non-scaling-stroke',
  cursor: 'pointer',
  transition: 'fill 160ms ease',
  selectors: {
    '&:hover': { fill: '#2c3242' },
  },
});

export const countryWithEvents = style({
  fill: '#232835',
  selectors: {
    '&:hover': { fill: '#2c3242' },
  },
});

export const countrySelected = style({
  stroke: vars.color.accentHover,
  strokeWidth: 1,
  selectors: {
    '&:hover': { fill: '#2c3242' },
  },
});

export const eventDot = style({
  cursor: 'pointer',
});

/* Journey arcs: dashes march slowly, like current along a wire. */
const dashMarch = keyframes({
  to: { strokeDashoffset: -50 },
});

export const journeyArcs = style({
  animation: `${dashMarch} 36s linear infinite`,
});

export const eventLabel = style({
  fontFamily: vars.font.label,
  fontSize: '9.5px',
  letterSpacing: '0.08em',
  fill: 'rgba(236, 233, 224, 0.78)',
  /* cartographic halo: paint the stroke beneath the glyphs */
  paintOrder: 'stroke',
  stroke: '#0b0d12',
  strokeWidth: 2.5,
  strokeLinejoin: 'round',
  strokeOpacity: 0.85,
  pointerEvents: 'none',
});

export const waterLabel = style({
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: '11px',
  letterSpacing: '0.34em',
  fill: 'rgba(236, 233, 224, 0.34)',
  textAnchor: 'middle',
  pointerEvents: 'none',
});

/* ── Message states ── */

export const messageState = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.md,
  minHeight: '320px',
  textAlign: 'center',
});

export const messageText = style({
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.7,
  fontFamily: vars.font.body,
  color: vars.color.textMuted,
});
