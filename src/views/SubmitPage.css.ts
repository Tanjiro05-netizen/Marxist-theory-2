import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

const rotate = keyframes({ to: { transform: 'rotate(360deg)' } });

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const hero = style({ position: 'relative', minHeight: '310px', overflow: 'hidden', borderBottom: vars.border.subtle });
export const heroGrid = style({ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(179, 18, 46, 0.18) 1px, transparent 1px)', backgroundSize: '18px 18px', opacity: 0.42, pointerEvents: 'none', maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)' });
export const heroContent = style({ position: 'relative', minHeight: '310px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '66px 24px 82px' });
export const heroCopy = style({ textAlign: 'center', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: vars.space.md });
export const heroKicker = style({ margin: 0, fontFamily: vars.font.label, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.34em', color: vars.color.accentHover });
export const heroTitle = style({ margin: 0, fontFamily: vars.font.display, fontSize: 'clamp(44px, 7vw, 72px)', fontWeight: 500, letterSpacing: '0.01em', lineHeight: 0.98 });
export const heroRule = style({ width: '48px', height: '2px', background: vars.color.accent });
export const heroQuote = style({ margin: 0, fontSize: '18px', lineHeight: 1.6, fontWeight: 300, color: vars.color.textSoft });

export const formSection = style({ maxWidth: '1120px', margin: '-46px auto 0', position: 'relative', zIndex: 1, padding: `0 ${vars.space.lg} ${vars.space.hero}`, '@media': { 'screen and (max-width: 720px)': { paddingInline: vars.space.md } } });
export const workspace = style({ border: vars.border.strong, background: vars.color.surface, boxShadow: vars.shadow.panel });
export const contextPanel = style({ minHeight: 0, padding: '32px 42px 30px', background: 'linear-gradient(145deg, #151924 0%, #0d1017 100%)', borderBottom: vars.border.strong, '@media': { 'screen and (max-width: 560px)': { padding: '28px 22px 26px' } } });
export const contextKicker = style({ margin: '0 0 10px', fontFamily: vars.font.label, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3em', color: vars.color.accentHover });
export const contextTitle = style({ margin: 0, maxWidth: '720px', fontFamily: vars.font.display, fontSize: 'clamp(25px, 4vw, 34px)', lineHeight: 1.12, fontWeight: 500, color: vars.color.text });
export const contextText = style({ maxWidth: '760px', margin: '12px 0 24px', fontSize: '14px', lineHeight: 1.65, color: vars.color.textMuted });
export const contextList = style({ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', borderTop: vars.border.subtle, borderBottom: vars.border.subtle, '@media': { 'screen and (max-width: 720px)': { gridTemplateColumns: '1fr' } } });
export const contextItem = style({ display: 'grid', gridTemplateColumns: '30px 1fr', gap: '10px', minWidth: 0, padding: '16px 18px 16px 0', color: vars.color.textFaint, fontFamily: vars.font.label, fontSize: '10px', letterSpacing: '0.08em', selectors: { '&:not(:last-child)': { borderRight: vars.border.subtle } }, '@media': { 'screen and (max-width: 720px)': { padding: '14px 0', selectors: { '&:not(:last-child)': { borderRight: 0, borderBottom: vars.border.subtle } } } } });
globalStyle(`${contextItem} p`, { margin: 0, fontFamily: vars.font.body, fontSize: '14px', letterSpacing: 0, lineHeight: 1.5, color: vars.color.textMuted });
globalStyle(`${contextItem} strong`, { display: 'block', marginBottom: '3px', fontFamily: vars.font.label, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.16em', color: vars.color.text });
export const privacyNote = style({ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: vars.font.label, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: vars.color.success });

export const formCard = style({ padding: '36px 42px 44px', background: vars.color.surface, '@media': { 'screen and (max-width: 560px)': { padding: '28px 22px 34px' } } });
export const formHeader = style({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: vars.space.md, paddingBottom: '26px', borderBottom: vars.border.subtle });
export const formEyebrow = style({ margin: '0 0 8px', fontFamily: vars.font.label, color: vars.color.accentHover, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.22em' });
export const formTitle = style({ margin: 0, fontFamily: vars.font.display, fontSize: '32px', lineHeight: 1.1, fontWeight: 500 });
export const draftBadge = style({ padding: '7px 10px', border: vars.border.subtle, fontFamily: vars.font.label, color: vars.color.textFaint, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.18em' });
export const form = style({ display: 'flex', flexDirection: 'column', gap: '28px', paddingTop: '20px' });
export const topActions = style({ display: 'flex', justifyContent: 'flex-end', gap: vars.space.md, flexWrap: 'wrap' });
export const guidelineBtn = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, padding: 0, background: 'none', border: 'none', color: vars.color.accentHover, fontSize: '12px', fontFamily: vars.font.label, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', selectors: { '&:hover': { color: vars.color.text } } });
export const adminBtn = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, padding: 0, background: 'none', border: 'none', color: vars.color.success, fontSize: '12px', fontFamily: vars.font.label, cursor: 'pointer', selectors: { '&:hover': { color: vars.color.text }, '&:disabled': { opacity: 0.5, cursor: 'not-allowed' } } });

export const fieldGrid = style({ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: vars.space.md, '@media': { 'screen and (max-width: 620px)': { gridTemplateColumns: '1fr' } } });
export const fieldBlock = style({ minWidth: 0 });
export const fieldLabel = style({ display: 'flex', alignItems: 'center', gap: '9px', fontFamily: vars.font.label, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: vars.color.textMuted, marginBottom: '10px' });
globalStyle(`${fieldLabel} span`, { color: vars.color.accentHover });

const inputBase = { width: '100%', padding: '13px 14px', background: '#0d1017', border: vars.border.strong, borderRadius: vars.radius.tiny, color: vars.color.text, fontSize: '15px', fontFamily: vars.font.body, outline: 'none', transition: 'border-color 160ms ease, background 160ms ease', selectors: { '&:focus': { borderColor: vars.color.accent, background: '#10131b' }, '&::placeholder': { color: vars.color.textFaint } } };
export const selectInput = style(inputBase);
export const textInput = style(inputBase);
export const textArea = style({ ...inputBase, resize: 'vertical', minHeight: '142px', lineHeight: 1.55 });
export const fieldMeta = style({ display: 'flex', justifyContent: 'space-between', gap: vars.space.md, marginTop: '8px', color: vars.color.textFaint, fontSize: '11px', lineHeight: 1.4, '@media': { 'screen and (max-width: 560px)': { flexDirection: 'column', gap: '3px' } } });

export const uploadZone = style({ minHeight: '210px', border: '1px dashed #343947', background: '#0d1017', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '9px', padding: '28px', color: vars.color.textFaint, textAlign: 'center', transition: 'border-color 160ms ease, background 160ms ease, color 160ms ease', selectors: { '&:hover': { borderColor: vars.color.accent, color: vars.color.accentHover } } });
globalStyle(`${uploadZone} strong`, { marginTop: '4px', color: vars.color.text, fontSize: '16px', fontWeight: 500 });
globalStyle(`${uploadZone} > span`, { fontSize: '13px' });
export const uploadZoneActive = style({ borderColor: vars.color.accentHover, background: vars.color.accentWash, color: vars.color.accentHover });
export const chooseFileBtn = style({ marginTop: '8px', padding: '9px 16px', background: 'transparent', border: vars.border.accent, color: vars.color.text, fontFamily: vars.font.label, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', cursor: 'pointer', selectors: { '&:hover': { background: vars.color.accent, borderColor: vars.color.accent } } });
export const hiddenInput = style({ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' });
export const fileCard = style({ display: 'grid', gridTemplateColumns: '52px 1fr auto', alignItems: 'center', gap: vars.space.md, padding: '18px', border: vars.border.strong, background: '#0d1017' });
export const fileIcon = style({ width: '52px', height: '58px', display: 'grid', placeItems: 'center', border: vars.border.accent, color: vars.color.accentHover, background: vars.color.accentWash });
export const fileInfo = style({ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' });
globalStyle(`${fileInfo} strong`, { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '15px', fontWeight: 500 });
globalStyle(`${fileInfo} > span`, { color: vars.color.textFaint, fontFamily: vars.font.label, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' });
export const removeFileBtn = style({ width: '34px', height: '34px', display: 'grid', placeItems: 'center', border: vars.border.subtle, background: 'transparent', color: vars.color.textFaint, cursor: 'pointer', selectors: { '&:hover:not(:disabled)': { color: vars.color.accentHover, borderColor: vars.color.accent }, '&:disabled': { opacity: 0.4, cursor: 'not-allowed' } } });
export const progressTrack = style({ height: '3px', marginTop: '5px', background: vars.color.surfaceSoft, overflow: 'hidden' });
globalStyle(`${progressTrack} span`, { display: 'block', height: '100%', background: vars.color.accentHover, transition: 'width 180ms ease' });
export const uploadHint = style({ fontFamily: vars.font.label, fontSize: '9px', color: vars.color.textFaint, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '9px 0 0' });
export const turnstile = style({ minHeight: '1px', width: '100%', display: 'flex', justifyContent: 'flex-end', color: vars.color.textFaint, fontSize: '12px' });

export const errorBox = style({ display: 'flex', alignItems: 'center', padding: vars.space.md, background: vars.color.accentWash, border: vars.border.accent, color: vars.color.accentHover, fontSize: '14px', gap: vars.space.sm });
export const successBox = style({ display: 'flex', alignItems: 'center', padding: vars.space.md, background: 'rgba(45,138,78,0.1)', border: '1px solid rgba(45,138,78,0.4)', color: '#5fbd7c', fontSize: '14px', gap: vars.space.sm });
export const submitRow = style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: vars.space.lg, paddingTop: '28px', borderTop: vars.border.subtle, '@media': { 'screen and (max-width: 660px)': { flexDirection: 'column', alignItems: 'stretch' } } });
export const submitAssurance = style({ display: 'flex', alignItems: 'center', gap: '9px', maxWidth: '280px', color: vars.color.textFaint, fontSize: '12px', lineHeight: 1.4 });
globalStyle(`${submitAssurance} svg`, { flexShrink: 0, color: vars.color.success });
export const submitBtn = style({ display: 'inline-flex', minWidth: '190px', minHeight: '46px', alignItems: 'center', justifyContent: 'center', gap: vars.space.xs, padding: '12px 22px', background: vars.color.accent, color: '#fff', border: '1px solid transparent', fontSize: '12px', fontWeight: 600, fontFamily: vars.font.label, textTransform: 'uppercase', letterSpacing: '0.13em', cursor: 'pointer', transition: 'background 160ms ease, border-color 160ms ease', selectors: { '&:hover:not(:disabled)': { background: vars.color.accentHover }, '&:disabled': { background: vars.color.surfaceSoft, borderColor: vars.color.borderStrong, color: vars.color.textFaint, cursor: 'not-allowed' } } });
export const spinner = style({ animation: `${rotate} 0.8s linear infinite` });
