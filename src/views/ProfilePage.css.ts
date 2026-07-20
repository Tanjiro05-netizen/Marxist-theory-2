import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text });
export const main = style({ maxWidth: '900px', margin: '0 auto', padding: `${vars.space.md} ${vars.space.md} ${vars.space.hero}` });
export const loadingPage = style({ minHeight: '100vh', background: vars.color.background, color: vars.color.text, display: 'flex', justifyContent: 'center', alignItems: 'center' });

/* ── Tabs ── */
export const tabRow = style({ display: 'flex', gap: vars.space.md, marginBottom: vars.space.lg, paddingBottom: vars.space.md, borderBottom: vars.border.subtle });
export const tabBtn = style({
  display: 'inline-flex', alignItems: 'center', padding: `${vars.space.xs} ${vars.space.md}`,
  borderRadius: vars.radius.md, border: 'none', fontSize: '13px', fontWeight: 500, fontFamily: vars.font.body,
  cursor: 'pointer', transition: 'all 160ms ease',
  background: vars.color.surface, color: vars.color.textMuted,
  selectors: { '&:hover': { background: vars.color.surfaceSoft, color: vars.color.text } },
});
export const tabBtnActive = style({ background: vars.color.accent, color: vars.color.text });

/* ── Profile tab ── */
export const banner = style({ position: 'relative', height: '192px', background: vars.color.surfaceSoft, borderRadius: `${vars.radius.xl} ${vars.radius.xl} 0 0`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${vars.color.border}`, overflow: 'hidden' });
export const bannerImg = style({ width: '100%', height: '100%', objectFit: 'cover' });
export const bannerPlaceholder = style({ textAlign: 'center', color: vars.color.textFaint });
export const profileCard = style({ position: 'relative', background: vars.color.surface, padding: vars.space.xl, borderRadius: `0 0 ${vars.radius.xl} ${vars.radius.xl}`, boxShadow: vars.shadow.panel, border: vars.border.subtle, borderTop: 'none' });
export const avatarWrap = style({ position: 'absolute', top: '-64px', left: vars.space.xl, width: '128px', height: '128px', background: vars.color.surfaceSoft, borderRadius: '50%', border: `4px solid ${vars.color.background}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: vars.color.textFaint, overflow: 'hidden' });
export const avatarImg = style({ width: '100%', height: '100%', objectFit: 'cover' });
export const uploadOverlay = style({ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', color: vars.color.text, cursor: 'pointer', opacity: 0, transition: 'opacity 160ms ease', selectors: { '&:hover': { opacity: 1 } } });
export const bannerUploadBtn = style({ position: 'absolute', top: vars.space.md, right: vars.space.md, display: 'inline-flex', alignItems: 'center', gap: vars.space.xxs, padding: `${vars.space.xxs} ${vars.space.sm}`, background: 'rgba(0,0,0,0.55)', color: vars.color.text, borderRadius: vars.radius.md, border: 'none', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'background 160ms ease', selectors: { '&:hover': { background: 'rgba(0,0,0,0.75)' } } });
export const editRow = style({ display: 'flex', justifyContent: 'flex-end', marginBottom: vars.space.md });
export const editBtn = style({ display: 'inline-flex', alignItems: 'center', padding: `${vars.space.xs} ${vars.space.md}`, background: vars.color.accent, color: vars.color.text, borderRadius: vars.radius.md, border: 'none', fontSize: '13px', fontWeight: 500, fontFamily: vars.font.body, cursor: 'pointer', transition: 'background 160ms ease', selectors: { '&:hover': { background: vars.color.accentHover }, '&:disabled': { opacity: 0.5 } } });
export const profileBody = style({ marginTop: '64px' });
export const fieldLabel = style({ display: 'block', fontSize: '13px', fontWeight: 500, color: vars.color.textMuted, marginBottom: vars.space.xxs });
export const fieldBlock = style({ marginBottom: vars.space.lg });
export const textInput = style({ display: 'block', width: '100%', background: vars.color.surfaceSoft, border: vars.border.subtle, borderRadius: vars.radius.md, padding: `${vars.space.xs} ${vars.space.sm}`, color: vars.color.text, fontSize: '14px', fontFamily: vars.font.body, outline: 'none', transition: 'border-color 160ms ease', selectors: { '&:focus': { borderColor: vars.color.accent } } });
export const textArea = style({ display: 'block', width: '100%', background: vars.color.surfaceSoft, border: vars.border.subtle, borderRadius: vars.radius.md, padding: `${vars.space.xs} ${vars.space.sm}`, color: vars.color.text, fontSize: '14px', fontFamily: vars.font.body, outline: 'none', transition: 'border-color 160ms ease', resize: 'vertical', selectors: { '&:focus': { borderColor: vars.color.accent } } });
export const profileName = style({ fontFamily: vars.font.display, fontSize: '30px', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: vars.space.md, display: 'flex', alignItems: 'center' });
export const certBadge = style({ marginLeft: vars.space.sm, display: 'inline-flex', alignItems: 'center', gap: vars.space.xxs, background: vars.color.info, color: vars.color.text, fontSize: '11px', fontWeight: 600, padding: `2px ${vars.space.xs}`, borderRadius: vars.radius.pill });
export const saveRow = style({ display: 'flex', justifyContent: 'flex-end', gap: vars.space.sm });
export const saveBtn = style({ display: 'inline-flex', alignItems: 'center', padding: `${vars.space.xs} ${vars.space.lg}`, background: vars.color.success, color: vars.color.text, borderRadius: vars.radius.md, border: 'none', fontSize: '13px', fontWeight: 500, fontFamily: vars.font.body, cursor: 'pointer', transition: 'background 160ms ease', selectors: { '&:hover': { background: '#24793e' }, '&:disabled': { opacity: 0.5 } } });
export const cancelBtn = style({ display: 'inline-flex', alignItems: 'center', padding: `${vars.space.xs} ${vars.space.lg}`, background: vars.color.surfaceSoft, color: vars.color.textMuted, borderRadius: vars.radius.md, border: 'none', fontSize: '13px', fontWeight: 500, fontFamily: vars.font.body, cursor: 'pointer', transition: 'background 160ms ease', selectors: { '&:hover': { background: vars.color.overlay, color: vars.color.text } } });
export const statsRow = style({ display: 'flex', alignItems: 'center', gap: vars.space.lg, margin: `${vars.space.sm} 0 ${vars.space.md}`, fontSize: '13px', color: vars.color.textMuted });
export const statsCount = style({ color: vars.color.text, fontWeight: 600 });
export const ideologyText = style({ fontSize: '13px', color: vars.color.accent, marginBottom: vars.space.sm });
export const bioText = style({ fontSize: '14px', lineHeight: 1.7, color: vars.color.textSoft, whiteSpace: 'pre-wrap' });
export const emptyBioText = style({ fontSize: '14px', color: vars.color.textFaint, fontStyle: 'italic' });
export const cardHeaderRow = style({ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: vars.space.sm });
export const cardRemoveBtn = style({ background: 'none', border: 'none', color: vars.color.textFaint, cursor: 'pointer', padding: vars.space.xxs, flexShrink: 0, transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.accent } } });
export const subTabRow = style({ display: 'flex', gap: vars.space.sm, marginBottom: vars.space.lg });
export const adminSection = style({ marginTop: vars.space.lg, paddingTop: vars.space.lg, borderTop: vars.border.subtle });
export const adminTitle = style({ fontSize: '16px', fontWeight: 600, color: vars.color.accent, marginBottom: vars.space.md });
export const adminBtn = style({ display: 'inline-flex', alignItems: 'center', padding: `${vars.space.xs} ${vars.space.md}`, borderRadius: vars.radius.md, border: 'none', fontSize: '13px', fontWeight: 500, fontFamily: vars.font.body, cursor: 'pointer', transition: 'background 160ms ease', color: vars.color.text });

/* ── Shared cards / sections ── */
export const sectionBlock = style({ marginTop: vars.space.xxl });
export const sectionTitle = style({ fontFamily: vars.font.display, fontSize: '24px', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: vars.space.lg });
export const cardGrid = style({ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: vars.space.lg, '@media': { 'screen and (max-width: 768px)': { gridTemplateColumns: '1fr' } } });
export const card = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.lg, padding: vars.space.md, display: 'block', transition: 'background 160ms ease', selectors: { '&:hover': { background: vars.color.surfaceSoft } } });
export const cardTitle = style({ fontSize: '16px', fontWeight: 600, marginBottom: vars.space.xs, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
export const cardExcerpt = style({ fontSize: '13px', lineHeight: 1.6, color: vars.color.textMuted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: vars.space.md });
export const cardMeta = style({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: vars.color.textFaint });
export const emptyCard = style({ textAlign: 'center', padding: `${vars.space.xxl} 0`, background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.lg, color: vars.color.textMuted, fontSize: '14px' });
export const quoteBlock = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.lg, padding: vars.space.md, position: 'relative' });
export const quoteText = style({ borderLeft: `3px solid ${vars.color.accent}`, paddingLeft: vars.space.md, fontStyle: 'italic', color: vars.color.textSoft, lineHeight: 1.7 });
export const quoteFooter = style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: vars.space.sm, fontSize: '11px', color: vars.color.textFaint });
export const quoteDeleteBtn = style({ background: 'none', border: 'none', color: vars.color.textFaint, cursor: 'pointer', padding: 0, transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.accent } } });

/* ── Dashboard / Learning shared ── */
export const dashStack = style({ display: 'flex', flexDirection: 'column', gap: vars.space.lg });
export const loadingCenter = style({ display: 'flex', justifyContent: 'center', padding: `${vars.space.xxl} 0` });
export const statGrid = style({ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: vars.space.md, '@media': { 'screen and (min-width: 768px)': { gridTemplateColumns: 'repeat(4, 1fr)' } } });
export const statCard = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.lg, padding: vars.space.md });
export const statLabel = style({ display: 'flex', alignItems: 'center', gap: vars.space.xs, color: vars.color.textMuted, fontSize: '13px', marginBottom: vars.space.xs });
export const statValue = style({ fontFamily: vars.font.display, fontSize: '28px', fontWeight: 600, color: vars.color.text });
export const statSub = style({ fontSize: '11px', color: vars.color.textFaint, marginTop: vars.space.xxs });
export const levelCard = style({ background: vars.color.surface, border: vars.border.accent, borderRadius: vars.radius.xl, padding: vars.space.lg });
export const levelHeader = style({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: vars.space.md });
export const levelRow = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm });
export const levelIcon = style({ width: '48px', height: '48px', borderRadius: '50%', background: vars.color.accentWash, display: 'flex', alignItems: 'center', justifyContent: 'center', color: vars.color.accent });
export const levelTitle = style({ fontFamily: vars.font.display, fontSize: '24px', fontWeight: 600 });
export const levelSub = style({ fontSize: '13px', color: vars.color.textMuted });
export const growthBadge = style({ display: 'inline-flex', alignItems: 'center', padding: `${vars.space.xxs} ${vars.space.sm}`, borderRadius: vars.radius.pill, fontSize: '12px', fontWeight: 500 });
export const growthPositive = style({ background: 'rgba(45,138,78,0.16)', color: vars.color.success });
export const growthNegative = style({ background: vars.color.accentWash, color: vars.color.accent });
export const progressLabel = style({ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: vars.color.textMuted, marginBottom: vars.space.xs });
export const progressTrack = style({ height: '12px', background: vars.color.surfaceSoft, borderRadius: vars.radius.pill, overflow: 'hidden' });
export const progressFill = style({ height: '100%', background: `linear-gradient(90deg, ${vars.color.accent}, ${vars.color.accentHover})`, borderRadius: vars.radius.pill, transition: 'width 500ms ease' });
export const progressHint = style({ fontSize: '11px', color: vars.color.textFaint, marginTop: vars.space.xs });
export const listPanel = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.lg, overflow: 'hidden' });
export const listHeader = style({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: vars.space.md, borderBottom: vars.border.subtle });
export const listHeaderTitle = style({ fontWeight: 600, display: 'flex', alignItems: 'center', gap: vars.space.xs });
export const listLink = style({ fontSize: '13px', color: vars.color.accent, transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.text } } });
export const listRow = style({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: vars.space.md, borderBottom: vars.border.subtle, transition: 'background 140ms ease', selectors: { '&:hover': { background: vars.color.surfaceSoft } } });
export const listEmpty = style({ padding: vars.space.xl, textAlign: 'center', color: vars.color.textMuted, fontSize: '14px' });
export const listItemBody = style({ flex: 1, minWidth: 0 });
export const listItemTitle = style({ color: vars.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
export const listItemMeta = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm, fontSize: '11px', color: vars.color.textFaint, marginTop: vars.space.xxs });
export const listItemTag = style({ background: vars.color.surfaceSoft, padding: `1px ${vars.space.xs}`, borderRadius: vars.radius.sm, fontSize: '11px' });
export const listItemStats = style({ display: 'flex', alignItems: 'center', gap: vars.space.md, fontSize: '12px', color: vars.color.textMuted, marginLeft: vars.space.md, flexShrink: 0 });
export const statIcon = style({ display: 'inline-flex', alignItems: 'center', gap: '3px' });

/* ── Learning XP cards ── */
export const xpGrid = style({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: vars.space.md, '@media': { 'screen and (max-width: 768px)': { gridTemplateColumns: '1fr' } } });
export const xpCard = style({ background: vars.color.surface, border: vars.border.subtle, borderRadius: vars.radius.lg, padding: vars.space.lg });
export const xpLabel = style({ display: 'flex', alignItems: 'center', gap: vars.space.xs, fontSize: '13px', fontWeight: 500, marginBottom: vars.space.xs });
export const xpValue = style({ fontFamily: vars.font.display, fontSize: '30px', fontWeight: 700 });
export const courseRow = style({ display: 'flex', alignItems: 'center', gap: vars.space.md, padding: vars.space.md, borderBottom: vars.border.subtle, transition: 'background 140ms ease', selectors: { '&:hover': { background: vars.color.surfaceSoft } } });
export const courseIcon = style({ width: '40px', height: '40px', borderRadius: vars.radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center' });
export const courseBody = style({ flex: 1, minWidth: 0 });
export const courseTitle = style({ color: vars.color.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
export const courseProgress = style({ display: 'flex', alignItems: 'center', gap: vars.space.xs, marginTop: vars.space.xxs });
export const courseTrack = style({ flex: 1, height: '6px', background: vars.color.surfaceSoft, borderRadius: vars.radius.pill, overflow: 'hidden', maxWidth: '200px' });
export const courseFill = style({ height: '100%', background: vars.color.accent, borderRadius: vars.radius.pill });
export const coursePercent = style({ fontSize: '11px', color: vars.color.textFaint });
export const completeBadge = style({ fontSize: '11px', background: 'rgba(45,138,78,0.16)', color: vars.color.success, padding: `2px ${vars.space.xs}`, borderRadius: vars.radius.sm });
export const certRow = style({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: vars.space.md, borderBottom: vars.border.subtle });
export const certTitle = style({ color: vars.color.text, fontWeight: 500 });
export const certNumber = style({ fontFamily: vars.font.mono, fontSize: '11px', color: vars.color.textFaint });
export const certMeta = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm });
export const certDate = style({ fontSize: '11px', color: vars.color.textFaint });
export const certVerify = style({ fontSize: '11px', color: vars.color.info, transition: 'color 140ms ease', selectors: { '&:hover': { color: vars.color.text } } });
