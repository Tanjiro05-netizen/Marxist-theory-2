import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const main = style({ maxWidth: vars.layout.maxWidth, margin: '0 auto', padding: `${vars.space.xl} ${vars.space.md} ${vars.space.hero}` });
export const loadingWrap = style({ minHeight: '100vh', background: vars.color.background, display: 'flex', alignItems: 'center', justifyContent: 'center', color: vars.color.text });
export const errorWrap = style({ textAlign: 'center', padding: `${vars.space.hero} 0` });
export const errorTitle = style({ fontFamily: vars.font.display, fontSize: '24px', fontWeight: 600, marginBottom: vars.space.md });
export const errorText = style({ color: vars.color.textMuted, fontSize: '14px' });
