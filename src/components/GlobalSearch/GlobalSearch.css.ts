import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/obsidianTheme.css.ts';

/* Command palette overlay — dark editorial plate over a dimmed page. */

export const backdrop = style({
  position: 'fixed',
  inset: 0,
  background: 'rgba(4, 5, 8, 0.62)',
  backdropFilter: 'blur(2px)',
  zIndex: 9990,
});

export const panel = style({
  position: 'fixed',
  top: '11vh',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'min(660px, 92vw)',
  maxHeight: '72vh',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.background,
  border: `1px solid ${vars.color.borderStrong}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.panel,
  zIndex: 9991,
  overflow: 'hidden',
});

export const inputRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderBottom: `1px solid ${vars.color.border}`,
  color: vars.color.textFaint,
});

export const input = style({
  flex: 1,
  minWidth: 0,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: '17px',
  '::placeholder': { color: vars.color.textFaint },
});

export const results = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: `${vars.space.xs} 0`,
});

export const groupLabel = style({
  display: 'block',
  padding: `${vars.space.sm} ${vars.space.lg} ${vars.space.xxs}`,
  fontFamily: vars.font.label,
  fontSize: '9.5px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const item = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.lg}`,
  textDecoration: 'none',
  color: vars.color.text,
  borderLeft: '2px solid transparent',
  selectors: {
    '&:hover': { background: vars.color.accentWash },
    '&[data-active="true"]': {
      background: vars.color.accentWash,
      borderLeftColor: vars.color.accent,
    },
  },
});

export const itemIcon = style({
  flexShrink: 0,
  marginTop: 2,
  color: vars.color.textFaint,
});

export const itemBody = style({ minWidth: 0, flex: 1 });

export const itemTitle = style({
  margin: 0,
  fontFamily: vars.font.body,
  fontSize: '14.5px',
  lineHeight: 1.4,
  color: vars.color.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const itemSub = style({
  margin: 0,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const snippet = style({
  margin: 0,
  fontFamily: vars.font.body,
  fontSize: '13px',
  lineHeight: 1.6,
  color: vars.color.textSoft,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',

  'mark.lib-hit': {
    background: 'rgba(179, 18, 46, 0.38)',
    color: 'inherit',
    padding: '0 1px',
  },
});

export const statusRow = style({
  padding: `${vars.space.xl} ${vars.space.lg}`,
  textAlign: 'center',
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  padding: `${vars.space.sm} ${vars.space.lg}`,
  borderTop: `1px solid ${vars.color.border}`,
  fontFamily: vars.font.label,
  fontSize: '9.5px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const footerHint = style({});

export const allResultsLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  color: vars.color.accentHover,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  selectors: { '&:hover': { color: vars.color.text } },
});
