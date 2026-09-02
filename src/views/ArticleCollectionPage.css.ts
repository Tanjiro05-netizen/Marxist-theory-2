import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const main = style({ maxWidth: vars.layout.maxWidth, margin: '0 auto', padding: `${vars.space.xl} ${vars.space.md} ${vars.space.hero}` });
export const pageTitle = style({ fontFamily: vars.font.display, fontSize: '40px', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: vars.space.xl });
export const errorText = style({ color: vars.color.accent });
export const grid = style({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: vars.space.lg, '@media': { 'screen and (max-width: 1024px)': { gridTemplateColumns: 'repeat(2, 1fr)' }, 'screen and (max-width: 640px)': { gridTemplateColumns: '1fr' } } });
export const card = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.lg, padding: vars.space.lg, display: 'block', transition: 'all 180ms ease', selectors: { '&:hover': { background: vars.color.surfaceSoft, borderColor: vars.color.borderStrong } } });
export const cardCategory = style({ fontFamily: vars.font.label, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: vars.color.accent, marginBottom: vars.space.xs });
export const cardTitle = style({ fontSize: '18px', fontWeight: 600, marginBottom: vars.space.sm });
export const cardExcerpt = style({ fontSize: '13px', lineHeight: 1.6, color: vars.color.textMuted, marginBottom: vars.space.md });
export const cardMeta = style({ fontFamily: vars.font.label, fontSize: '11px', color: vars.color.textFaint });
