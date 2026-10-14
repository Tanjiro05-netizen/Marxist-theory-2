import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const footer = style({ borderTop: vars.border.strong, background: vars.color.background });
export const inner = style({
  maxWidth: '1100px', margin: '0 auto', padding: '20px 20px 28px',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px 24px',
  color: vars.color.textMuted, fontFamily: vars.font.label, fontSize: '11px',
});
export const mark = style({ margin: 0 });
export const links = style({ display: 'flex', flexWrap: 'wrap', gap: '4px 24px' });
export const link = style({
  display: 'inline-flex', alignItems: 'center', minHeight: '44px', color: vars.color.textMuted,
  selectors: { '&:hover, &:focus-visible': {
    color: vars.color.accentHover, textDecoration: 'underline', textDecorationThickness: '1px', textUnderlineOffset: '5px',
  } },
});
