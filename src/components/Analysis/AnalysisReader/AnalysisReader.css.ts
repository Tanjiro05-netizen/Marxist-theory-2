import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from '../../../styles/obsidianTheme.css.ts';

/* Analysis text stage — mirrors the fullscreen reader pattern: the text sits
   directly on the ground with side rails, no gray boxes. */

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });

export const loadingWrap = style({ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: vars.color.text });

export const errorWrap = style({ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: vars.space.md, padding: `0 ${vars.space.md}`, textAlign: 'center' });
export const errorTitle = style({ fontFamily: vars.font.display, fontSize: '30px', fontWeight: 500 });
export const errorText = style({ color: vars.color.textMuted, fontSize: '14px' });
export const errorLink = style({
  display: 'inline-flex', alignItems: 'center', minHeight: '44px', padding: `0 ${vars.space.lg}`,
  border: `1px solid ${vars.color.borderStrong}`, color: vars.color.text, textDecoration: 'none',
  fontFamily: vars.font.label, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
  cursor: 'pointer', background: 'transparent', transition: 'color var(--dur-micro) var(--ease-standard), border-color var(--dur-micro) var(--ease-standard)',
  selectors: { '&:hover': { color: vars.color.accentHover, borderColor: vars.color.accentHover } },
});

/* Mode strip — one hairline-bounded bar instead of the old colored banners */
export const modeStrip = style({
  display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: vars.space.sm,
  padding: `${vars.space.xs} 0`, marginBottom: vars.space.lg,
  borderTop: `1px solid ${vars.color.borderStrong}`, borderBottom: `1px solid ${vars.color.borderStrong}`,
});
export const modeLabel = style({ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: vars.font.label, fontSize: '10px', fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: vars.color.accentHover });
export const modeNote = style({ fontFamily: vars.font.label, fontSize: '10px', letterSpacing: '0.08em', color: vars.color.textFaint, '@media': { 'screen and (max-width: 640px)': { display: 'none' } } });
export const modeToggle = style({
  display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '34px', padding: `0 ${vars.space.sm}`,
  border: `1px solid ${vars.color.borderStrong}`, background: 'transparent', color: vars.color.textSoft,
  fontFamily: vars.font.label, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
  cursor: 'pointer', transition: 'color var(--dur-micro) var(--ease-standard), border-color var(--dur-micro) var(--ease-standard)',
  selectors: { '&:hover': { color: vars.color.accentHover, borderColor: vars.color.accentHover } },
});

export const stage = style({
  maxWidth: '1760px', margin: '0 auto',
  paddingTop: '96px',
  padding: `96px max(24px, env(safe-area-inset-right)) ${vars.space.hero} max(24px, env(safe-area-inset-left))`,
  '@media': { 'screen and (max-width: 1023px)': { paddingBottom: '88px' } },
});
export const stageGrid = style({
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)',
  gap: vars.space.xxl, alignItems: 'start',
  '@media': { 'screen and (min-width: 1024px)': { gridTemplateColumns: '230px minmax(0, 1fr)' } },
  selectors: {},
});
export const readingGrid = style({
  '@media': { 'screen and (min-width: 1024px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});
export const analysisGrid = style({
  '@media': { 'screen and (min-width: 1200px)': { gridTemplateColumns: '230px minmax(0, 1fr) 320px' } },
});
export const sideRail = style({ minWidth: 0, display: 'none', '@media': { 'screen and (min-width: 1024px)': { display: 'block' } } });
export const sticky = style({ position: 'sticky', top: '72px' });

export const column = style({ minWidth: 0, maxWidth: '76ch', margin: '0 auto' });

/* Unboxed reading surface — sections separated by hairlines, not panels */
export const content = style({ position: 'relative' });

/* Tool rail */
export const railTabs = style({ display: 'flex', flexWrap: 'wrap', gap: vars.space.xxs, marginBottom: vars.space.md });
export const railTab = style({
  flex: '1 1 auto', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
  padding: `${vars.space.xs} ${vars.space.sm}`, minHeight: '48px',
  background: 'transparent', border: `1px solid ${vars.color.borderStrong}`, color: vars.color.textSoft,
  fontFamily: vars.font.label, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
  cursor: 'pointer', transition: 'color var(--dur-micro) var(--ease-standard), border-color var(--dur-micro) var(--ease-standard)',
  selectors: { '&:hover': { color: vars.color.text } },
});
export const railTabActive = style({ color: vars.color.accentHover, borderColor: 'rgba(155, 16, 34, 0.55)' });
export const railPanel = style({ border: `1px solid ${vars.color.border}`, background: vars.color.surface, padding: vars.space.md });

export const mobileBar = style({
  position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
  display: 'flex', justifyContent: 'space-around', padding: `${vars.space.xxs} 0 max(4px, env(safe-area-inset-bottom))`,
  background: vars.color.background, borderTop: `1px solid ${vars.color.borderStrong}`,
  '@media': { 'screen and (min-width: 1024px)': { display: 'none' } },
});
export const mobileBarBtn = style({
  display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
  padding: `${vars.space.xs} ${vars.space.md}`, background: 'transparent', border: 'none',
  color: vars.color.textMuted, fontFamily: vars.font.label, fontSize: '9px', letterSpacing: '0.08em',
  textTransform: 'uppercase', cursor: 'pointer', transition: 'color var(--dur-micro) var(--ease-standard)',
});
export const mobileBarBtnActive = style({ color: vars.color.accentHover });

/* Glossary annotation — injected into raw section HTML by glossifyHtml */
globalStyle('.ar-gloss-term', {
  cursor: 'pointer',
  borderBottom: '1px dotted rgba(155, 16, 34, 0.65)',
  transition: 'background var(--dur-micro) var(--ease-standard)',
});
globalStyle('.ar-gloss-term:hover', {
  background: 'rgba(155, 16, 34, 0.12)',
  borderBottomStyle: 'solid',
});
