import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/obsidianTheme.css.ts';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  minHeight: '360px',
});

/* ── Control panel — same vocabulary as the page toolbar ── */

export const controls = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space.sm,
});

export const controlGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
});

export const controlLabel = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.22em',
  color: vars.color.textFaint,
  marginRight: vars.space.xxs,
});

export const typeBtn = style({
  display: 'flex',
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
    '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
  },
});

export const typeBtnActive = style({
  background: vars.color.accent,
  color: '#ffffff',
  borderColor: 'transparent',
  selectors: {
    '&:hover': { background: vars.color.accentHover, color: '#ffffff' },
  },
});

export const select = style({
  height: '36px',
  padding: `0 ${vars.space.sm}`,
  border: vars.border.subtle,
  background: vars.color.surface,
  color: vars.color.textSoft,
  fontFamily: vars.font.label,
  fontSize: '12px',
  letterSpacing: '0.04em',
  cursor: 'pointer',
  transition: 'border-color 140ms ease',
  selectors: {
    '&:hover': { borderColor: vars.color.borderStrong },
    '&:focus': { outline: 'none', borderColor: vars.color.accentHover },
  },
});

/* ── Country panel — collapsible chips row ── */

export const countryPanel = style({
  border: vars.border.subtle,
  background: vars.color.surfaceRaised,
  padding: vars.space.sm,
});

export const countryChips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.xs,
});

export const countryChip = style({
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

export const countryChipActive = style({
  color: vars.color.text,
  borderColor: vars.color.borderAccent,
  background: vars.color.accentWash,
  selectors: {
    '&:hover': { color: vars.color.text },
  },
});

export const chipDot = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  flexShrink: 0,
});

export const countryToggle = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.22em',
  color: vars.color.textFaint,
  cursor: 'pointer',
  marginBottom: vars.space.sm,
  transition: 'color 140ms ease',
  selectors: {
    '&:hover': { color: vars.color.accentHover },
  },
});

/* ── Chart area ── */

export const chartArea = style({
  position: 'relative',
  height: '460px',
  width: '100%',
});

export const tooltipCard = style({
  background: vars.color.overlay,
  border: vars.border.strong,
  padding: `${vars.space.sm} ${vars.space.md}`,
  minWidth: '160px',
});

export const tooltipYear = style({
  margin: 0,
  marginBottom: vars.space.xs,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const tooltipRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  fontSize: '12px',
  fontFamily: vars.font.label,
  color: vars.color.textMuted,
  lineHeight: 1.8,
});

export const tooltipValue = style({
  marginLeft: 'auto',
  color: vars.color.text,
  fontVariantNumeric: 'tabular-nums',
});

export const zoomReset = style({
  position: 'absolute',
  top: 0,
  right: 0,
  zIndex: 5,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  minHeight: '28px',
  padding: `0 ${vars.space.sm}`,
  border: vars.border.subtle,
  background: vars.color.surface,
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  cursor: 'pointer',
  transition: 'all 140ms ease',
  selectors: {
    '&:hover': { color: vars.color.accentHover, borderColor: vars.color.borderAccent },
  },
});

/* ── States ── */

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

export const retryBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  minHeight: '34px',
  padding: `0 ${vars.space.md}`,
  border: vars.border.strong,
  background: 'transparent',
  color: vars.color.text,
  fontFamily: vars.font.label,
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 140ms ease',
  selectors: {
    '&:hover': { color: vars.color.accentHover, borderColor: vars.color.accentHover },
  },
});

/* ── Stat cards — quiet hairline row ── */

export const statGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '1px',
  background: vars.color.borderStrong,
  border: vars.border.subtle,
  '@media': {
    'screen and (max-width: 640px)': { gridTemplateColumns: '1fr' },
  },
});

export const statCell = style({
  background: vars.color.surface,
  padding: `${vars.space.md} ${vars.space.lg}`,
});

export const statLabel = style({
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.22em',
  color: vars.color.textFaint,
  marginBottom: vars.space.xs,
});

export const statValue = style({
  fontFamily: vars.font.display,
  fontSize: '28px',
  fontWeight: 500,
  letterSpacing: '-0.01em',
  lineHeight: 1.1,
  color: vars.color.text,
  fontVariantNumeric: 'tabular-nums',
});

export const statNote = style({
  marginTop: vars.space.xxs,
  fontFamily: vars.font.label,
  fontSize: '11px',
  color: vars.color.textFaint,
  fontVariantNumeric: 'tabular-nums',
});

export const statDeltaDown = style({
  color: vars.color.accentHover,
});

export const statDeltaUp = style({
  color: vars.color.success,
});

/* ── Crisis legend ── */

export const crisisLegend = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.md,
  alignItems: 'center',
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.06em',
  color: vars.color.textFaint,
});

export const crisisItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
});

export const crisisSwatch = style({
  width: '12px',
  height: '8px',
  border: `1px dashed ${vars.color.borderAccent}`,
  background: vars.color.accentWash,
  flexShrink: 0,
});
