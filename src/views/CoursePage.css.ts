import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const loadingWrap = style({ paddingTop: vars.space.xl, textAlign: 'center', color: vars.color.textMuted });
export const notFoundWrap = style({ paddingTop: vars.space.xl, textAlign: 'center' });
export const notFoundText = style({ color: vars.color.textMuted, fontSize: '16px' });
export const notFoundLink = style({ color: vars.color.accent, marginTop: vars.space.md, display: 'inline-block', transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.text } } });
