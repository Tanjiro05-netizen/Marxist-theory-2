import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });

export const hero = style({ position: 'relative', height: '50vh', overflow: 'hidden' });
export const heroGrid = style({ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(200,30,30,0.12) 1px, transparent 1px)', backgroundSize: '16px 16px', opacity: 0.35, pointerEvents: 'none' });
export const heroContent = style({ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: vars.color.text });
export const heroCopy = style({ textAlign: 'center', maxWidth: '800px', padding: `0 ${vars.space.md}`, display: 'flex', flexDirection: 'column', gap: vars.space.xl });
export const heroTitle = style({ fontFamily: vars.font.display, fontSize: '60px', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1, '@media': { 'screen and (max-width: 640px)': { fontSize: '38px' } } });
export const heroQuote = style({ fontSize: '18px', lineHeight: 1.6, fontWeight: 300, color: vars.color.textSoft, '@media': { 'screen and (max-width: 640px)': { fontSize: '16px' } } });

export const formSection = style({ maxWidth: '720px', margin: '-64px auto 0', position: 'relative', zIndex: 1, padding: `0 ${vars.space.md} ${vars.space.hero}` });
export const formCard = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.xl, padding: vars.space.xl, boxShadow: vars.shadow.panel });
export const form = style({ display: 'flex', flexDirection: 'column', gap: vars.space.lg });

export const topActions = style({ display: 'flex', justifyContent: 'flex-end', gap: vars.space.md, flexWrap: 'wrap' });
export const guidelineBtn = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, background: 'none', border: 'none', color: vars.color.accent, fontSize: '13px', fontFamily: vars.font.body, cursor: 'pointer', transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.text } } });
export const adminBtn = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, background: 'none', border: 'none', color: vars.color.success, fontSize: '13px', fontFamily: vars.font.body, cursor: 'pointer', transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.text }, '&:disabled': { opacity: 0.5, cursor: 'not-allowed' } } });

export const fieldBlock = style({});
export const fieldLabel = style({ display: 'block', fontSize: '13px', fontWeight: 500, color: vars.color.text, marginBottom: vars.space.xs });
export const selectInput = style({ width: '100%', padding: vars.space.sm, background: vars.color.surfaceSoft, border: vars.border.subtle, borderRadius: vars.radius.md, color: vars.color.text, fontSize: '14px', fontFamily: vars.font.body, outline: 'none', transition: 'border-color 160ms ease', selectors: { '&:focus': { borderColor: vars.color.accent } } });
export const textInput = style({ width: '100%', padding: vars.space.sm, background: vars.color.surfaceSoft, border: vars.border.subtle, borderRadius: vars.radius.md, color: vars.color.text, fontSize: '14px', fontFamily: vars.font.body, outline: 'none', transition: 'border-color 160ms ease', selectors: { '&:focus': { borderColor: vars.color.accent }, '&::placeholder': { color: vars.color.textFaint } } });
export const textArea = style({ width: '100%', padding: vars.space.sm, background: vars.color.surfaceSoft, border: vars.border.subtle, borderRadius: vars.radius.md, color: vars.color.text, fontSize: '14px', fontFamily: vars.font.body, outline: 'none', resize: 'vertical', minHeight: '128px', transition: 'border-color 160ms ease', selectors: { '&:focus': { borderColor: vars.color.accent }, '&::placeholder': { color: vars.color.textFaint } } });

export const uploadLabel = style({ position: 'relative', cursor: 'pointer', background: vars.color.surfaceSoft, border: vars.border.subtle, borderRadius: vars.radius.md, padding: vars.space.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', color: vars.color.text, transition: 'background 140ms ease', selectors: { '&:hover': { background: vars.color.overlay } } });
export const uploadHint = style({ fontSize: '12px', color: vars.color.textFaint, textAlign: 'center', marginTop: vars.space.xs });

export const errorBox = style({ display: 'flex', alignItems: 'center', padding: vars.space.sm, background: vars.color.accentWash, borderRadius: vars.radius.md, color: vars.color.accent, fontSize: '14px', gap: vars.space.sm });
export const successBox = style({ display: 'flex', alignItems: 'center', padding: vars.space.sm, background: 'rgba(45,138,78,0.12)', borderRadius: vars.radius.md, color: vars.color.success, fontSize: '14px', gap: vars.space.sm });

export const submitRow = style({ display: 'flex', justifyContent: 'center', paddingTop: vars.space.lg });
export const submitBtn = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, padding: `${vars.space.sm} ${vars.space.xl}`, background: vars.color.accent, color: vars.color.text, borderRadius: vars.radius.md, border: 'none', fontSize: '15px', fontWeight: 600, fontFamily: vars.font.body, cursor: 'pointer', transition: 'background 160ms ease', selectors: { '&:hover:not(:disabled)': { background: vars.color.accentHover }, '&:disabled': { background: vars.color.surfaceSoft, color: vars.color.textFaint, cursor: 'not-allowed' } } });
