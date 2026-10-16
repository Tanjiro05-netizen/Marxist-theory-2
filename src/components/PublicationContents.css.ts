import { style } from '@vanilla-extract/css';

export const list = style({ listStyle: 'none', margin: 0, padding: 0, borderTop: '1px solid var(--line)' });
export const columns = style({
  '@media': { '(min-width: 800px)': {
    display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: '48px',
  } },
});
export const item = style({ minWidth: 0, borderBottom: '1px solid var(--line)' });
export const link = style({
  display: 'flex', alignItems: 'center', gap: '14px', minHeight: '48px', padding: '12px 12px', margin: '0 -12px',
  color: 'var(--paper)', textDecoration: 'none', transition: 'color var(--dur-micro) var(--ease-standard), background var(--dur-micro) var(--ease-standard)',
  selectors: {
    '&:hover, &:focus-visible': { color: '#c11730', background: 'rgba(155, 16, 34, 0.07)' },
  },
  '@media': { '(prefers-reduced-motion: reduce)': { transition: 'none' } },
});
export const iconFrame = style({
  flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '34px', height: '34px', border: '1px solid var(--line)', color: 'var(--paper-dim)',
  transition: 'color var(--dur-micro) var(--ease-standard), border-color var(--dur-micro) var(--ease-standard)',
  selectors: {
    [`${link}:hover &, ${link}:focus-visible &`]: { color: '#c11730', borderColor: 'rgba(155, 16, 34, 0.5)' },
  },
});
export const number = style({
  flexShrink: 0, width: '22px', color: '#c11730', fontFamily: 'var(--ff-label), sans-serif',
  fontSize: '11px', fontVariantNumeric: 'tabular-nums',
});
export const title = style({
  minWidth: 0, fontFamily: 'var(--ff-body), Georgia, serif', fontSize: 'clamp(22px, 2.1vw, 28px)',
  fontWeight: 400, lineHeight: 1.2, overflowWrap: 'anywhere',
  textDecoration: 'underline', textDecorationColor: 'transparent',
  textDecorationThickness: '1px', textUnderlineOffset: '5px',
  transition: 'text-decoration-color var(--dur-micro) var(--ease-standard)',
  selectors: { [`${link}:hover &, ${link}:focus-visible &`]: { textDecorationColor: '#c11730' } },
});
export const access = style({
  marginLeft: 'auto', paddingLeft: '6px', flexShrink: 0, color: '#c11730',
  fontFamily: 'var(--ff-label), sans-serif', fontSize: '10px', lineHeight: 1.5,
  '@media': { '(max-width: 359px)': { fontSize: '9px', paddingLeft: 0 } },
});
