import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: 'calc(100vh - 4rem)', background: vars.color.background, color: vars.color.text });
export const inner = style({ maxWidth: vars.layout.maxWidth, margin: '0 auto', padding: `${vars.space.lg} ${vars.space.md}` });
export const backLink = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, fontSize: '13px', color: vars.color.textMuted, marginBottom: vars.space.lg, transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.text } } });

export const loadingWrap = style({ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' });
export const loadingInner = style({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: vars.space.sm });
export const loadingText = style({ fontSize: '13px', color: vars.color.textMuted });
export const errorWrap = style({ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' });
export const errorBox = style({ display: 'flex', alignItems: 'center', gap: vars.space.xs, background: vars.color.accentWash, color: vars.color.accent, padding: vars.space.md, borderRadius: vars.radius.md, border: vars.border.accent });

export const grid = style({ display: 'grid', gap: vars.space.lg, '@media': { 'screen and (min-width: 1280px)': { gridTemplateColumns: '320px minmax(0,1fr)' } } });

export const sidebar = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.xl, padding: vars.space.lg, height: 'fit-content', '@media': { 'screen and (min-width: 1280px)': { position: 'sticky', top: '96px' } } });
export const coverWrap = style({ aspectRatio: '3/4', borderRadius: vars.radius.lg, overflow: 'hidden', background: vars.color.surfaceSoft, border: vars.border.subtle, marginBottom: vars.space.lg, display: 'flex', alignItems: 'center', justifyContent: 'center' });
export const coverImg = style({ width: '100%', height: '100%', objectFit: 'cover' });
export const coverFallback = style({ padding: vars.space.lg, textAlign: 'center' });
export const coverFallbackIcon = style({ color: vars.color.accent, opacity: 0.7, margin: `0 auto ${vars.space.sm}` });
export const coverFallbackText = style({ fontSize: '13px', color: vars.color.textSoft, lineHeight: 1.5 });

export const bookTitle = style({ fontFamily: vars.font.display, fontSize: '24px', fontWeight: 600, lineHeight: 1.2 });
export const bookAuthor = style({ color: vars.color.textMuted, marginTop: vars.space.xs, fontSize: '14px' });
export const bookDesc = style({ fontSize: '13px', color: vars.color.textSoft, lineHeight: 1.6, marginTop: vars.space.md });

export const metaStack = style({ display: 'flex', flexDirection: 'column', gap: vars.space.sm, marginTop: vars.space.lg, fontSize: '13px', color: vars.color.textSoft });
export const metaRow = style({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: vars.space.sm });
export const metaLabel = style({ color: vars.color.textFaint });
export const metaValue = style({ textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: vars.space.xxs });

export const actionStack = style({ display: 'grid', gap: vars.space.sm, marginTop: vars.space.lg });
export const downloadBtn = style({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: `${vars.space.sm} ${vars.space.md}`, background: vars.color.accent, color: vars.color.text, borderRadius: vars.radius.lg, fontWeight: 500, fontSize: '14px', fontFamily: vars.font.body, transition: 'background 160ms ease', selectors: { '&:hover': { background: vars.color.accentHover } } });
export const extBtn = style({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: `${vars.space.sm} ${vars.space.md}`, background: 'transparent', border: vars.border.subtle, color: vars.color.textSoft, borderRadius: vars.radius.lg, fontWeight: 500, fontSize: '14px', fontFamily: vars.font.body, transition: 'all 160ms ease', selectors: { '&:hover': { background: vars.color.surfaceSoft, color: vars.color.text } } });

export const readerSection = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.xl, overflow: 'hidden' });
export const readerHeader = style({ display: 'flex', flexDirection: 'column', gap: vars.space.sm, borderBottom: vars.border.subtle, padding: `${vars.space.md} ${vars.space.lg}`, '@media': { 'screen and (min-width: 768px)': { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } } });
export const readerTitle = style({ fontSize: '16px', fontWeight: 600 });
export const readerDesc = style({ fontSize: '13px', color: vars.color.textMuted });
export const readerExtLink = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, fontSize: '13px', color: vars.color.accent, transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.text } } });
export const iframeWrap = style({ height: '72vh', minHeight: '640px', background: '#050505' });
export const iframe = style({ width: '100%', height: '100%', border: 'none' });
export const noPdfWrap = style({ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: vars.color.background, padding: `0 ${vars.space.lg}` });
export const noPdfBox = style({ display: 'flex', alignItems: 'center', gap: vars.space.xs, background: 'rgba(200,134,10,0.12)', color: vars.color.warning, padding: vars.space.md, borderRadius: vars.radius.md, border: '1px solid rgba(200,134,10,0.25)' });
