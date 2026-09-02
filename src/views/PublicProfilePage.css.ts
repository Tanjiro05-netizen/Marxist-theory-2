import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const main = style({ maxWidth: '900px', margin: '0 auto', padding: `0 ${vars.space.md} ${vars.space.hero}` });
export const loadingWrap = style({ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' });
export const loadingText = style({ color: vars.color.textMuted });
export const notFoundWrap = style({ textAlign: 'center', padding: `${vars.space.hero} 0` });
export const notFoundIcon = style({ color: vars.color.textFaint, margin: `0 auto ${vars.space.md}` });
export const notFoundTitle = style({ fontFamily: vars.font.display, fontSize: '24px', fontWeight: 600, marginBottom: vars.space.xs });
export const notFoundText = style({ color: vars.color.textMuted, marginBottom: vars.space.lg });
export const backBtn = style({ display: 'inline-flex', alignItems: 'center', padding: `${vars.space.xs} ${vars.space.md}`, background: vars.color.accent, color: vars.color.text, borderRadius: vars.radius.md, fontSize: '14px', fontWeight: 500, transition: 'background 160ms ease', selectors: { '&:hover': { background: vars.color.accentHover } } });

export const banner = style({ position: 'relative', height: '192px', background: vars.color.surfaceSoft, borderRadius: `${vars.radius.xl} ${vars.radius.xl} 0 0`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' });
export const bannerImg = style({ width: '100%', height: '100%', objectFit: 'cover' });
export const bannerPlaceholder = style({ textAlign: 'center', color: vars.color.textFaint });

export const profileCard = style({ position: 'relative', background: vars.color.surface, padding: vars.space.xl, borderRadius: `0 0 ${vars.radius.xl} ${vars.radius.xl}`, border: vars.border.subtle, borderTop: 'none' });
export const avatarWrap = style({ position: 'absolute', top: '-64px', left: vars.space.xl, width: '128px', height: '128px', background: vars.color.surfaceSoft, borderRadius: '50%', border: `4px solid ${vars.color.background}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' });
export const avatarImg = style({ width: '100%', height: '100%', objectFit: 'cover' });
export const avatarFallback = style({ textAlign: 'center', color: vars.color.textFaint });

export const profileBody = style({ marginTop: '64px' });
export const profileName = style({ fontFamily: vars.font.display, fontSize: '28px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: vars.space.xs, marginBottom: vars.space.xs });
export const certBadge = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xxs, background: vars.color.info, color: vars.color.text, fontSize: '11px', fontWeight: 600, padding: `2px ${vars.space.xs}`, borderRadius: vars.radius.pill });
export const ideology = style({ fontSize: '13px', color: vars.color.accent, marginBottom: vars.space.md });
export const bio = style({ fontSize: '14px', lineHeight: 1.7, color: vars.color.textSoft });
export const backRow = style({ marginTop: vars.space.lg });
export const backLink = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, fontSize: '13px', color: vars.color.textMuted, transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.text } } });

export const tabRow = style({ display: 'flex', gap: vars.space.md, marginTop: vars.space.xl, paddingTop: vars.space.lg, borderTop: vars.border.subtle });
export const tabBtn = style({ padding: `${vars.space.xs} ${vars.space.md}`, borderRadius: vars.radius.md, border: 'none', fontSize: '13px', fontWeight: 500, fontFamily: vars.font.body, cursor: 'pointer', transition: 'all 160ms ease', background: vars.color.surfaceSoft, color: vars.color.textMuted, selectors: { '&:hover': { background: vars.color.overlay, color: vars.color.text } } });
export const tabBtnActive = style({ background: vars.color.accent, color: vars.color.text });

export const activitySection = style({ marginTop: vars.space.xl });
export const activityTitle = style({ fontFamily: vars.font.display, fontSize: '20px', fontWeight: 500, marginBottom: vars.space.md });
export const activityGrid = style({ display: 'flex', flexDirection: 'column', gap: vars.space.md });
export const activityCard = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.lg, padding: vars.space.md, display: 'block', transition: 'background 160ms ease', selectors: { '&:hover': { background: vars.color.surfaceSoft } } });
export const activityCardTitle = style({ fontWeight: 600, marginBottom: vars.space.xxs });
export const activityCardMeta = style({ fontSize: '12px', color: vars.color.textFaint, display: 'flex', alignItems: 'center', gap: vars.space.sm });
export const activityCardContent = style({ fontSize: '13px', color: vars.color.textMuted, lineHeight: 1.5, marginTop: vars.space.xs });
export const emptyState = style({ textAlign: 'center', padding: `${vars.space.xl} 0`, color: vars.color.textMuted, fontSize: '14px' });
