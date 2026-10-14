import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

/* Fullscreen dispatch stage — the text sits directly on the ink, unboxed,
   mirroring the theory reader. The EPUB book reader stays contained by
   design; dispatches read edge to edge with a bounded measure. */

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const main = style({
  minWidth: 0,
  margin: '0 auto',
  padding: `${vars.space.lg} max(24px, env(safe-area-inset-right)) ${vars.space.hero} max(24px, env(safe-area-inset-left))`,
});
export const backLink = style({
  display: 'inline-flex', alignItems: 'center', gap: vars.space.xs, minHeight: '44px',
  fontSize: '12px', fontFamily: vars.font.label, letterSpacing: '0.14em', textTransform: 'uppercase',
  color: vars.color.textMuted, marginBottom: vars.space.md, textDecoration: 'none',
  transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.accentHover } },
});
export const loadingWrap = style({ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `${vars.space.hero} 0` });
export const errorWrap = style({ textAlign: 'center', padding: `${vars.space.hero} 0`, color: vars.color.textMuted });

/* Header band — centered newspaper head, hairline-bounded, unboxed */
export const articleCard = style({
  maxWidth: '76ch',
  margin: '0 auto',
  textAlign: 'center',
  padding: `${vars.space.xl} 0 ${vars.space.xl}`,
  borderBottom: `1px solid ${vars.color.border}`,
  marginBottom: vars.space.xl,
});
export const badgeRow = style({ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: vars.space.xs, marginBottom: vars.space.md });
export const badge = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xxs, padding: `${vars.space.xxs} ${vars.space.sm}`, borderRadius: vars.radius.pill, fontSize: '11px', fontFamily: vars.font.label, letterSpacing: '0.1em', textTransform: 'uppercase' });
export const badgeAccent = style({ background: vars.color.accentWash, color: vars.color.accentHover });
export const badgeDefault = style({ background: 'transparent', border: `1px solid ${vars.color.borderStrong}`, color: vars.color.textSoft });
export const articleTitle = style({
  fontFamily: vars.font.display, fontSize: 'clamp(32px, 4.2vw, 54px)', fontWeight: 500,
  letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: vars.space.md, color: vars.color.text, textWrap: 'balance',
  '@media': { 'screen and (max-width: 640px)': { fontSize: '28px' } },
});
export const articleExcerpt = style({ fontSize: '17px', lineHeight: 1.6, fontWeight: 300, color: vars.color.textSoft, marginBottom: vars.space.lg });
export const articleMeta = style({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: vars.space.md, fontSize: '12px', fontFamily: vars.font.label, letterSpacing: '0.14em', textTransform: 'uppercase', color: vars.color.textMuted });
export const metaItem = style({ display: 'inline-flex', alignItems: 'center', gap: vars.space.xs });

export const imageWrap = style({ maxWidth: '1100px', margin: `0 auto ${vars.space.xl}`, overflow: 'hidden', border: `1px solid ${vars.color.borderStrong}`, background: vars.color.surfaceRaised });
export const articleImage = style({ width: '100%', maxHeight: '560px', objectFit: 'cover' });

export const contentCard = style({ maxWidth: '76ch', margin: '0 auto' });
export const contentBody = style({
  fontSize: '17px',
  lineHeight: 1.9,
  color: vars.color.textSoft,
  whiteSpace: 'pre-wrap',
  selectors: {
    '&::first-letter': {
      fontFamily: vars.font.display,
      fontWeight: 600,
      fontSize: '3.4em',
      float: 'left',
      lineHeight: 0.8,
      paddingRight: '0.14em',
      paddingTop: '0.06em',
      color: vars.color.accentHover,
    },
  },
});

export const navSection = style({
  maxWidth: '76ch',
  margin: `0 auto`,
  marginTop: vars.space.xxl,
  paddingTop: vars.space.lg,
  borderTop: `1px solid ${vars.color.border}`,
});
export const navTitle = style({ fontSize: '12px', fontFamily: vars.font.label, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: vars.color.textMuted, marginBottom: vars.space.sm });
export const navGrid = style({ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: vars.space.sm, '@media': { 'screen and (max-width: 640px)': { gridTemplateColumns: '1fr' } } });
export const navCard = style({ padding: vars.space.sm, border: `1px solid ${vars.color.borderStrong}`, transition: 'border-color 140ms ease', selectors: { '&:hover': { borderColor: vars.color.accentHover } } });
export const navCardEmpty = style({ padding: vars.space.sm, border: `1px solid ${vars.color.border}`, fontSize: '11px', color: vars.color.textFaint });
export const navLabel = style({ fontSize: '11px', color: vars.color.textFaint, display: 'inline-flex', alignItems: 'center', gap: vars.space.xxs, fontFamily: vars.font.label, letterSpacing: '0.08em', textTransform: 'uppercase' });
export const navCardTitle = style({ fontSize: '14px', color: vars.color.text, marginTop: vars.space.xxs, lineHeight: 1.4 });

export const relatedMeta = style({ fontSize: '11px', color: vars.color.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: vars.font.label });
export const relatedTitle = style({ fontSize: '14px', color: vars.color.text, marginTop: vars.space.xxs, lineHeight: 1.4 });
