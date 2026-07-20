import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });

export const main = style({ maxWidth: vars.layout.maxWidth, margin: '0 auto', padding: `${vars.space.xl} ${vars.space.md} ${vars.space.hero}` });

export const pageTitle = style({ fontFamily: vars.font.display, fontSize: '40px', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: vars.space.xl });

export const layout = style({ display: 'flex', gap: vars.space.xl, '@media': { 'screen and (max-width: 900px)': { flexDirection: 'column' } } });

export const sidebar = style({ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: vars.space.md, position: 'sticky', top: '80px', alignSelf: 'flex-start', '@media': { 'screen and (max-width: 900px)': { width: '100%', position: 'static' } } });

export const toolCard = style({
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: vars.radius.lg,
  border: vars.border.subtle,
  padding: vars.space.md,
  background: vars.color.surface,
  cursor: 'pointer',
  transition: 'all 200ms ease',
  textAlign: 'left',
  fontFamily: vars.font.body,
  selectors: { '&:hover': { background: vars.color.surfaceSoft, borderColor: vars.color.borderStrong, transform: 'scale(1.02)' } },
});

export const toolCardActive = style({
  background: `linear-gradient(135deg, ${vars.color.accentWash} 0%, ${vars.color.accentSoft} 100%)`,
  borderColor: vars.color.borderAccent,
});

export const toolRow = style({ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', gap: vars.space.md });

export const toolIconWrap = style({ padding: vars.space.xs, borderRadius: vars.radius.md, background: vars.color.surfaceSoft, color: vars.color.textMuted });
export const toolIconWrapActive = style({ background: vars.color.accentWash, color: vars.color.accent });

export const toolName = style({ fontWeight: 600, fontSize: '14px', color: vars.color.textSoft, marginBottom: vars.space.xxs });
export const toolNameActive = style({ color: vars.color.text });

export const toolDesc = style({ fontSize: '13px', color: vars.color.textMuted, lineHeight: 1.5 });

export const toolAccent = style({ position: 'absolute', bottom: 0, left: 0, height: '2px', background: vars.color.accent, transition: 'width 300ms ease', width: 0 });
export const toolAccentActive = style({ width: '100%' });

export const timelineBtn = style({
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: vars.radius.lg,
  border: vars.border.subtle,
  padding: vars.space.md,
  background: vars.color.surface,
  cursor: 'pointer',
  transition: 'all 200ms ease',
  fontFamily: vars.font.body,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.md,
  color: vars.color.textSoft,
  selectors: { '&:hover': { background: vars.color.surfaceSoft, borderColor: vars.color.borderStrong, transform: 'scale(1.02)' } },
});
export const timelineBtnActive = style({ background: `linear-gradient(135deg, ${vars.color.accentWash} 0%, ${vars.color.accentSoft} 100%)`, borderColor: vars.color.borderAccent, color: vars.color.text });
export const timelineIcon = style({ color: vars.color.textMuted });
export const timelineIconActive = style({ color: vars.color.accent });

export const contentArea = style({ flex: 1, minWidth: 0 });

export const placeholder = style({
  background: vars.color.surface,
  border: vars.border.subtle,
  borderRadius: vars.radius.xl,
  padding: vars.space.lg,
  minHeight: '600px',
  position: 'relative',
  overflow: 'hidden',
});

export const placeholderTitle = style({ fontFamily: vars.font.display, fontSize: '24px', fontWeight: 500, marginBottom: vars.space.md });
export const placeholderText = style({ fontSize: '14px', color: vars.color.textMuted });
