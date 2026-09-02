import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text, position: 'relative', overflow: 'hidden' });
export const main = style({ maxWidth: vars.layout.maxWidth, margin: '0 auto', padding: `${vars.space.md} ${vars.space.md} ${vars.space.hero}`, position: 'relative', zIndex: 10 });
export const pageTitle = style({ fontFamily: vars.font.display, fontSize: '40px', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: vars.space.xl });

export const vizGrid = style({ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: vars.space.md, marginBottom: vars.space.xl, '@media': { 'screen and (max-width: 1024px)': { gridTemplateColumns: 'repeat(2, 1fr)' }, 'screen and (max-width: 640px)': { gridTemplateColumns: '1fr' } } });
export const vizCard = style({ padding: vars.space.md, borderRadius: vars.radius.lg, border: vars.border.subtle, background: vars.color.surface, cursor: 'pointer', transition: 'all 200ms ease', selectors: { '&:hover': { borderColor: vars.color.borderStrong, background: vars.color.surfaceSoft } } });
export const vizCardActive = style({ borderColor: vars.color.borderAccent, background: vars.color.accentWash });
export const vizIcon = style({ color: vars.color.textMuted, marginBottom: vars.space.xs });
export const vizIconActive = style({ color: vars.color.accent });
export const vizName = style({ fontWeight: 600, fontSize: '14px', marginBottom: vars.space.xxs });
export const vizNameActive = style({ color: vars.color.text });
export const vizDesc = style({ fontSize: '12px', color: vars.color.textFaint });

export const toolbar = style({ display: 'flex', flexWrap: 'wrap', gap: vars.space.md, marginBottom: vars.space.xl, alignItems: 'center' });
export const toolbarGroup = style({ display: 'flex', gap: vars.space.xs });
export const toolBtn = style({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: vars.radius.sm, border: vars.border.subtle, background: vars.color.surface, color: vars.color.textMuted, cursor: 'pointer', transition: 'all 140ms ease', selectors: { '&:hover': { background: vars.color.surfaceSoft, color: vars.color.text } } });
export const toolBtnActive = style({ background: vars.color.accent, color: vars.color.text, borderColor: 'transparent' });

export const chartWrap = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.xl, padding: vars.space.lg, minHeight: '400px' });
export const transitionOverlay = style({ position: 'absolute', inset: 0, background: vars.color.background, opacity: 0.5, zIndex: 20, pointerEvents: 'none' });
