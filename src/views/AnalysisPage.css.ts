import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const main = style({ maxWidth: vars.layout.maxWidth, margin: '0 auto', padding: `${vars.space.xl} ${vars.space.md} ${vars.space.hero}` });
export const loadingWrap = style({ minHeight: '100vh', background: vars.color.background, display: 'flex', alignItems: 'center', justifyContent: 'center', color: vars.color.text });

export const pageTitle = style({ fontFamily: vars.font.display, fontSize: '40px', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, display: 'flex', alignItems: 'center' });
export const pageTitleIcon = style({ marginRight: vars.space.sm, color: vars.color.accent });
export const pageCount = style({ color: vars.color.textMuted, fontSize: '14px' });

export const searchRow = style({ display: 'flex', flexDirection: 'column', gap: vars.space.md, marginBottom: vars.space.xl, '@media': { 'screen and (min-width: 768px)': { flexDirection: 'row' } } });
export const searchWrap = style({ position: 'relative', flex: 1 });
export const searchIcon = style({ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: vars.color.textFaint, pointerEvents: 'none' });
export const searchInput = style({ width: '100%', background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.md, padding: `${vars.space.sm} ${vars.space.md} ${vars.space.sm} 40px`, color: vars.color.text, fontSize: '14px', fontFamily: vars.font.body, outline: 'none', transition: 'border-color 160ms ease', selectors: { '&:focus': { borderColor: vars.color.accent }, '&::placeholder': { color: vars.color.textFaint } } });
export const selectInput = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.md, padding: `${vars.space.sm} ${vars.space.md}`, color: vars.color.text, fontSize: '14px', fontFamily: vars.font.body, outline: 'none', cursor: 'pointer' });
export const viewToggle = style({ display: 'flex', alignItems: 'center', justifyContent: 'center', background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.md, padding: `${vars.space.sm} ${vars.space.md}`, color: vars.color.text, cursor: 'pointer', transition: 'background 140ms ease', selectors: { '&:hover': { background: vars.color.surfaceSoft } } });
export const filterRow = style({ display: 'flex', flexWrap: 'wrap', gap: vars.space.xs, marginBottom: vars.space.xl });
export const filterPill = style({ padding: `${vars.space.xs} ${vars.space.md}`, borderRadius: vars.radius.pill, fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 140ms ease', background: vars.color.surface, color: vars.color.textSoft, fontFamily: vars.font.body, selectors: { '&:hover': { background: vars.color.surfaceSoft, color: vars.color.text } } });
export const filterPillActive = style({ background: vars.color.accent, color: vars.color.text });
export const errorBox = style({ color: vars.color.accent, background: vars.color.accentWash, padding: vars.space.sm, borderRadius: vars.radius.md, marginBottom: vars.space.lg, fontSize: '14px' });
export const gridView = style({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: vars.space.lg, '@media': { 'screen and (max-width: 1024px)': { gridTemplateColumns: 'repeat(2, 1fr)' }, 'screen and (max-width: 640px)': { gridTemplateColumns: '1fr' } } });
export const listView = style({ display: 'flex', flexDirection: 'column', gap: vars.space.lg });

export const card = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.lg, display: 'flex', flexDirection: 'column', transition: 'border-color 180ms ease', selectors: { '&:hover': { borderColor: vars.color.borderAccent } } });
export const cardList = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.lg, display: 'flex', transition: 'border-color 180ms ease', selectors: { '&:hover': { borderColor: vars.color.borderAccent } } });
export const cardBody = style({ padding: vars.space.md, flex: 1 });
export const cardCategory = style({ fontFamily: vars.font.label, fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.22em', color: vars.color.accentHover, marginBottom: vars.space.xs });
export const cardTitle = style({ fontFamily: vars.font.display, fontSize: '21px', fontWeight: 500, lineHeight: 1.25, marginBottom: vars.space.xs, transition: 'color 160ms ease' });
export const cardDesc = style({ fontSize: '13px', lineHeight: 1.6, color: vars.color.textSoft, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: vars.space.sm });
export const cardFooter = style({ padding: vars.space.md, borderTop: vars.border.subtle, marginTop: 'auto' });
export const analyzeBtn = style({ width: '100%', textAlign: 'center', background: vars.color.accentWash, color: vars.color.accent, fontWeight: 600, padding: `${vars.space.xs} 0`, borderRadius: vars.radius.md, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontFamily: vars.font.body, transition: 'background 140ms ease', selectors: { '&:hover': { background: vars.color.accentSoft }, '&:disabled': { opacity: 0.5, cursor: 'not-allowed' } } });

export const backBtn = style({ display: 'inline-flex', alignItems: 'center', minHeight: '44px', padding: `0 ${vars.space.md}`, background: 'transparent', color: vars.color.textMuted, border: 'none', fontSize: '12px', fontFamily: vars.font.label, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: vars.space.md, cursor: 'pointer', transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.accentHover } } });

/* Article stage — unboxed, like the theory reader: centered title band,
   hairline tabs, prose directly on the ground. */
export const readerStage = style({ maxWidth: '76ch', margin: '0 auto' });
export const readerTitleBand = style({ textAlign: 'center', padding: `${vars.space.xl} 0`, borderBottom: vars.border.subtle, marginBottom: vars.space.xl });
export const readerTitle = style({ fontFamily: vars.font.display, fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: vars.space.sm, textWrap: 'balance' });
export const readerCategory = style({ fontFamily: vars.font.label, fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.28em', color: vars.color.accentHover });
export const tabRow = style({ borderBottom: vars.border.subtle, marginBottom: vars.space.xl, display: 'flex', gap: vars.space.xl, justifyContent: 'center' });
export const tabBtn = style({ padding: `${vars.space.md} ${vars.space.xxs}`, borderBottom: '2px solid transparent', fontSize: '13px', fontWeight: 500, color: vars.color.textMuted, background: 'none', border: 'none', borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 140ms ease', fontFamily: vars.font.body, selectors: { '&:hover': { color: vars.color.textSoft, borderBottomColor: vars.color.borderStrong } } });
export const tabBtnActive = style({ color: vars.color.accent, borderBottomColor: vars.color.accent });
export const contentPane = style({ fontSize: '17px', lineHeight: 1.9, selectors: {
  '& > p:first-of-type::first-letter': {
    fontFamily: vars.font.display,
    fontWeight: 600,
    fontSize: '3.4em',
    float: 'left',
    lineHeight: 0.8,
    paddingRight: '0.14em',
    paddingTop: '0.06em',
    color: vars.color.accentHover,
  },
} });

/* Concordance jump highlight — sand wash reads on both light and dark */
export const concordanceHit = style({ background: 'rgba(216, 199, 159, 0.35)', color: 'inherit', padding: '0 2px' });
