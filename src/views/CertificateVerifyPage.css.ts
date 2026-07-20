import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const inner = style({ maxWidth: '640px', margin: '0 auto', padding: `${vars.space.xl} ${vars.space.md} ${vars.space.hero}` });

export const loadingWrap = style({ textAlign: 'center', padding: `${vars.space.hero} 0` });
export const spinner = style({ width: '48px', height: '48px', border: `4px solid ${vars.color.accent}`, borderTopColor: 'transparent', borderRadius: '50%', margin: `0 auto ${vars.space.md}`, animation: 'spin 800ms linear infinite' });
export const loadingText = style({ color: vars.color.textMuted, fontSize: '14px' });

export const errorWrap = style({ textAlign: 'center', padding: `${vars.space.hero} 0` });
export const errorIcon = style({ width: '80px', height: '80px', borderRadius: '50%', background: vars.color.accentWash, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: `0 auto ${vars.space.lg}`, color: vars.color.accent });
export const errorTitle = style({ fontFamily: vars.font.display, fontSize: '24px', fontWeight: 600, marginBottom: vars.space.xs });
export const errorText = style({ color: vars.color.textMuted, fontSize: '14px', marginBottom: vars.space.lg });
export const errorLink = style({ color: vars.color.accent, fontSize: '14px', transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.text } } });

export const successWrap = style({ textAlign: 'center' });
export const successIcon = style({ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(45,138,78,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: `0 auto ${vars.space.lg}`, color: vars.color.success });
export const successTitle = style({ fontFamily: vars.font.display, fontSize: '30px', fontWeight: 600, marginBottom: vars.space.xs });
export const successSubtitle = style({ color: vars.color.success, fontSize: '16px', marginBottom: vars.space.xl });

export const card = style({ background: vars.color.surface, border: vars.border.accent, borderRadius: vars.radius.xl, padding: vars.space.xl, textAlign: 'left' });
export const cardHeader = style({ display: 'flex', alignItems: 'center', gap: vars.space.md, marginBottom: vars.space.lg });
export const cardIconWrap = style({ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(200,134,10,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: vars.color.warning });
export const cardTitle = style({ fontFamily: vars.font.display, fontSize: '20px', fontWeight: 600 });
export const cardNumber = style({ fontFamily: vars.font.mono, fontSize: '12px', color: vars.color.textFaint });

export const detailStack = style({ display: 'flex', flexDirection: 'column', gap: vars.space.md });
export const detailRow = style({ display: 'flex', alignItems: 'flex-start', gap: vars.space.sm });
export const detailIcon = style({ color: vars.color.textFaint, marginTop: '2px', flexShrink: 0 });
export const detailLabel = style({ fontSize: '12px', color: vars.color.textFaint });
export const detailValue = style({ fontWeight: 500, color: vars.color.text });
export const detailSub = style({ fontSize: '13px', color: vars.color.textMuted });
export const detailScore = style({ fontWeight: 500, color: vars.color.success });

export const cardFooter = style({ marginTop: vars.space.xl, paddingTop: vars.space.lg, borderTop: vars.border.subtle, display: 'flex', flexWrap: 'wrap', gap: vars.space.sm });
export const primaryBtn = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, padding: `${vars.space.xs} ${vars.space.md}`, background: vars.color.accent, color: vars.color.text, borderRadius: vars.radius.md, fontSize: '14px', fontWeight: 500, fontFamily: vars.font.body, transition: 'background 160ms ease', selectors: { '&:hover': { background: vars.color.accentHover } } });
export const secondaryBtn = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, padding: `${vars.space.xs} ${vars.space.md}`, background: 'transparent', border: vars.border.subtle, color: vars.color.textSoft, borderRadius: vars.radius.md, fontSize: '14px', fontWeight: 500, fontFamily: vars.font.body, transition: 'all 160ms ease', selectors: { '&:hover': { background: vars.color.surfaceSoft, color: vars.color.text } } });
