import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const main = style({ maxWidth: '900px', margin: '0 auto', padding: `${vars.space.xl} ${vars.space.md} ${vars.space.hero}` });
export const backLink = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, fontSize: '13px', color: vars.color.textMuted, marginBottom: vars.space.lg, transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.text } } });
export const loadingWrap = style({ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `${vars.space.hero} 0` });
export const errorWrap = style({ textAlign: 'center', padding: `${vars.space.hero} 0`, color: vars.color.textMuted });

export const articleCard = style({ background: vars.color.surfaceRaised, border: vars.border.subtle, borderRadius: vars.radius.xl, padding: `${vars.space.lg} ${vars.space.xl}`, marginBottom: vars.space.lg, '@media': { 'screen and (max-width: 640px)': { padding: vars.space.lg } } });
export const badgeRow = style({ display: 'flex', flexWrap: 'wrap', gap: vars.space.xs, marginBottom: vars.space.md });
export const badge = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xxs, padding: `${vars.space.xxs} ${vars.space.sm}`, borderRadius: vars.radius.pill, fontSize: '11px', fontFamily: vars.font.mono, letterSpacing: '0.06em', textTransform: 'uppercase' });
export const badgeAccent = style({ background: vars.color.accentWash, color: vars.color.accent });
export const badgeDefault = style({ background: vars.color.surfaceSoft, color: vars.color.textSoft });
export const articleTitle = style({ fontFamily: vars.font.display, fontSize: '36px', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: vars.space.md, '@media': { 'screen and (max-width: 640px)': { fontSize: '28px' } } });
export const articleExcerpt = style({ fontSize: '17px', lineHeight: 1.6, fontWeight: 300, color: vars.color.textSoft, marginBottom: vars.space.lg });
export const articleMeta = style({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: vars.space.md, fontSize: '13px', color: vars.color.textMuted });
export const metaItem = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs });

export const imageWrap = style({ marginBottom: vars.space.xl, overflow: 'hidden', borderRadius: vars.radius.xl, border: vars.border.subtle, background: vars.color.surfaceRaised });
export const articleImage = style({ width: '100%', maxHeight: '520px', objectFit: 'cover' });

export const contentCard = style({ background: vars.color.surfaceRaised, border: vars.border.subtle, borderRadius: vars.radius.xl, padding: `${vars.space.lg} ${vars.space.xl}`, '@media': { 'screen and (max-width: 640px)': { padding: vars.space.lg } } });
export const contentBody = style({ fontSize: '15px', lineHeight: 1.8, color: vars.color.textSoft, whiteSpace: 'pre-wrap' });

export const navSection = style({ marginTop: vars.space.lg, background: vars.color.surfaceRaised, border: vars.border.subtle, borderRadius: vars.radius.xl, padding: vars.space.lg });
export const navTitle = style({ fontSize: '16px', fontWeight: 600, marginBottom: vars.space.sm });
export const navGrid = style({ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: vars.space.sm, '@media': { 'screen and (max-width: 640px)': { gridTemplateColumns: '1fr' } } });
export const navCard = style({ padding: vars.space.sm, borderRadius: vars.radius.lg, border: vars.border.subtle, transition: 'border-color 140ms ease', selectors: { '&:hover': { borderColor: vars.color.borderStrong } } });
export const navCardEmpty = style({ padding: vars.space.sm, borderRadius: vars.radius.lg, border: vars.border.subtle, fontSize: '11px', color: vars.color.textFaint });
export const navLabel = style({ fontSize: '11px', color: vars.color.textFaint, display: 'inline-flex', alignItems: 'center', gap: vars.space.xxs });
export const navCardTitle = style({ fontSize: '13px', color: vars.color.text, marginTop: vars.space.xxs });

export const relatedMeta = style({ fontSize: '11px', color: vars.color.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' });
export const relatedTitle = style({ fontSize: '13px', color: vars.color.text, marginTop: vars.space.xxs });
