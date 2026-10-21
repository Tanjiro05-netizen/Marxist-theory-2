import { style } from '@vanilla-extract/css';
import { vars } from './styles/obsidianTheme.css.ts';

export const page = style({ background: vars.color.background, color: vars.color.text });
export const contents = style({
  maxWidth: '1100px', margin: '0 auto',
  padding: 'clamp(28px, 4vw, 48px) max(20px, env(safe-area-inset-right)) 56px max(20px, env(safe-area-inset-left))',
});
export const heading = style({
  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
  gap: '16px', flexWrap: 'wrap', marginBottom: '24px',
});
export const title = style({
  margin: 0, fontFamily: vars.font.display, fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 500, lineHeight: 1,
});
export const submit = style({
  display: 'inline-flex', alignItems: 'center', minHeight: '44px', fontFamily: vars.font.label,
  fontSize: '12px', color: vars.color.textSoft, textDecoration: 'underline',
  textUnderlineOffset: '5px', textDecorationThickness: '1px',
  selectors: { '&:hover, &:focus-visible': { color: vars.color.accentHover } },
});
