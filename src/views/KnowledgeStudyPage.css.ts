import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const main = style({ maxWidth: vars.layout.maxWidth, margin: '0 auto', padding: `${vars.space.xl} ${vars.space.md} ${vars.space.hero}` });
export const pageTitle = style({ fontFamily: vars.font.display, fontSize: '40px', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: vars.space.xl });
export const grid = style({ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: vars.space.xl, '@media': { 'screen and (max-width: 1024px)': { gridTemplateColumns: '1fr' } } });
export const sidebar = style({ '@media': { 'screen and (min-width: 1025px)': { position: 'sticky', top: '80px', alignSelf: 'start' } } });
export const contentArea = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xl });
export const card = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.xl, padding: vars.space.lg });
export const cardTitle = style({ fontFamily: vars.font.display, fontSize: '20px', fontWeight: 500, marginBottom: vars.space.md });
export const loadingCenter = style({ display: 'flex', justifyContent: 'center', padding: `${vars.space.xxl} 0` });
