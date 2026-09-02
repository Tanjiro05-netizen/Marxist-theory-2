import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

/* ── Page shell ── */
export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const main = style({ maxWidth: vars.layout.maxWidth, margin: '0 auto', padding: `${vars.space.xl} ${vars.space.md} ${vars.space.hero}` });

/* ── Header ── */
export const header = style({ marginBottom: vars.space.xl });
export const headerRow = style({ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: vars.space.lg, flexWrap: 'wrap' });
export const pageTitle = style({ fontFamily: vars.font.display, fontSize: '48px', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, margin: 0, '@media': { 'screen and (max-width: 640px)': { fontSize: '36px' } } });
export const pageTitleIcon = style({ marginRight: vars.space.sm, color: vars.color.accent });
export const subtitle = style({ margin: `${vars.space.sm} 0 0`, fontSize: '14px', lineHeight: 1.7, color: vars.color.textMuted, maxWidth: '600px' });
export const countBadge = style({ fontFamily: vars.font.label, fontSize: '11px', letterSpacing: '0.06em', color: vars.color.textFaint, whiteSpace: 'nowrap' });

/* ── Toolbar ── */
export const toolbar = style({ display: 'flex', flexDirection: 'column', gap: vars.space.md, marginBottom: vars.space.xl });
export const searchRow = style({ display: 'flex', gap: vars.space.md, '@media': { 'screen and (max-width: 640px)': { flexDirection: 'column' } } });
export const searchWrap = style({ position: 'relative', flex: 1 });
export const searchIcon = style({ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: vars.color.textFaint, pointerEvents: 'none' });
export const searchInput = style({ width: '100%', background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.md, padding: `${vars.space.sm} ${vars.space.md} ${vars.space.sm} 40px`, color: vars.color.text, fontSize: '14px', fontFamily: vars.font.body, outline: 'none', transition: 'border-color 160ms ease', selectors: { '&:focus': { borderColor: vars.color.accent }, '&::placeholder': { color: vars.color.textFaint } } });
export const filterRow = style({ display: 'flex', flexWrap: 'wrap', gap: vars.space.xs });
export const filterPill = style({ padding: `${vars.space.xs} ${vars.space.md}`, borderRadius: vars.radius.pill, fontSize: '12px', fontWeight: 500, border: vars.border.subtle, cursor: 'pointer', transition: 'all 160ms ease', background: 'transparent', color: vars.color.textMuted, fontFamily: vars.font.body, selectors: { '&:hover': { background: vars.color.surfaceSoft, color: vars.color.text, borderColor: vars.color.borderStrong } } });
export const filterPillActive = style({ background: vars.color.accentSoft, borderColor: vars.color.borderAccent, color: vars.color.text, boxShadow: vars.shadow.glow });

/* ── Featured card ── */
export const featured = style({ display: 'grid', gridTemplateColumns: '1fr', gap: 0, background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.xl, overflow: 'hidden', marginBottom: vars.space.xl, transition: 'border-color 200ms ease', selectors: { '&:hover': { borderColor: vars.color.borderAccent } }, '@media': { 'screen and (min-width: 768px)': { gridTemplateColumns: '1fr 1fr' } } });
export const featuredImage = style({ width: '100%', height: '240px', objectFit: 'cover', '@media': { 'screen and (min-width: 768px)': { height: '100%', minHeight: '320px' } } });
export const featuredImageFallback = style({ width: '100%', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${vars.color.surfaceSoft}, ${vars.color.surface})`, color: vars.color.textFaint, '@media': { 'screen and (min-width: 768px)': { height: '100%', minHeight: '320px' } } });
export const featuredBody = style({ padding: vars.space.lg, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: vars.space.sm });
export const featuredBadge = style({ fontFamily: vars.font.label, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: vars.color.accent });
export const featuredTitle = style({ fontFamily: vars.font.display, fontSize: '30px', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0, '@media': { 'screen and (max-width: 640px)': { fontSize: '24px' } } });
export const featuredExcerpt = style({ fontSize: '14px', lineHeight: 1.75, color: vars.color.textSoft, margin: 0 });
export const featuredMeta = style({ display: 'flex', alignItems: 'center', gap: vars.space.md, fontSize: '12px', color: vars.color.textFaint, fontFamily: vars.font.label, letterSpacing: '0.04em' });
export const featuredLink = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, color: vars.color.accent, fontSize: '13px', fontWeight: 600, marginTop: vars.space.xs, transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.accentHover } } });

/* ── Card grid ── */
export const grid = style({ display: 'grid', gridTemplateColumns: '1fr', gap: vars.space.lg, '@media': { 'screen and (min-width: 640px)': { gridTemplateColumns: 'repeat(2, 1fr)' }, 'screen and (min-width: 1024px)': { gridTemplateColumns: 'repeat(3, 1fr)' } } });
export const card = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.lg, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 180ms ease', selectors: { '&:hover': { borderColor: vars.color.borderAccent } } });
export const cardImage = style({ width: '100%', height: '180px', objectFit: 'cover' });
export const cardImageFallback = style({ width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: vars.color.surfaceSoft, color: vars.color.textFaint });
export const cardBody = style({ padding: vars.space.md, flex: 1, display: 'flex', flexDirection: 'column', gap: vars.space.xs });
export const cardBadge = style({ fontFamily: vars.font.label, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: vars.color.accent });
export const cardTitle = style({ fontSize: '16px', fontWeight: 600, lineHeight: 1.3, margin: 0 });
export const cardExcerpt = style({ fontSize: '13px', lineHeight: 1.6, color: vars.color.textSoft, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 });
export const cardFooter = style({ padding: `${vars.space.sm} ${vars.space.md}`, borderTop: vars.border.subtle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' });
export const cardMeta = style({ fontSize: '11px', color: vars.color.textFaint, fontFamily: vars.font.label, letterSpacing: '0.04em' });
export const cardLink = style({ display: 'inline-flex', alignItems: 'center', gap: '4px', color: vars.color.accent, fontSize: '12px', fontWeight: 600, transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.accentHover } } });

/* ── States ── */
export const emptyState = style({ padding: `${vars.space.xxl} ${vars.space.lg}`, textAlign: 'center', color: vars.color.textMuted, fontSize: '14px', lineHeight: 1.7, border: vars.border.subtle, borderRadius: vars.radius.lg, background: vars.color.surface });
export const loadingWrap = style({ minHeight: '100vh', background: vars.color.background, display: 'flex', alignItems: 'center', justifyContent: 'center', color: vars.color.textMuted, gap: vars.space.sm });
