import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text, overflowY: 'auto' });

export const hero = style({ position: 'relative', padding: `${vars.space.xl} ${vars.space.md} ${vars.space.xxl}` });
export const heroInner = style({ maxWidth: vars.layout.maxWidth, margin: '0 auto', textAlign: 'center' });
export const heroTitleCn = style({ fontFamily: vars.font.display, fontSize: '48px', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: vars.space.xs, '@media': { 'screen and (max-width: 640px)': { fontSize: '36px' } } });
export const heroTitleEn = style({ fontFamily: vars.font.display, fontSize: '32px', fontWeight: 500, color: vars.color.accent, marginBottom: vars.space.md });
export const heroDesc = style({ fontSize: '15px', lineHeight: 1.7, fontWeight: 300, color: vars.color.textSoft, maxWidth: '600px', margin: '0 auto' });

export const tabBar = style({
  position: 'sticky',
  top: '52px',
  zIndex: 10,
  background: `${vars.color.background}ee`,
  backdropFilter: 'blur(8px)',
  borderBottom: vars.border.subtle,
});
export const tabBarInner = style({ maxWidth: vars.layout.maxWidth, margin: '0 auto', padding: `${vars.space.xs} ${vars.space.md}`, display: 'flex', gap: vars.space.xxs });
export const tabBtn = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.lg}`,
  borderRadius: vars.radius.md,
  border: 'none',
  fontFamily: vars.font.body,
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 180ms ease',
  background: vars.color.surfaceSoft,
  color: vars.color.textMuted,
  selectors: { '&:hover': { background: vars.color.overlay, color: vars.color.text } },
});
export const tabBtnActive = style({ background: vars.color.accent, color: vars.color.text, boxShadow: vars.shadow.glow });

export const content = style({ maxWidth: vars.layout.maxWidth, margin: '0 auto', padding: `${vars.space.xl} ${vars.space.md}` });
