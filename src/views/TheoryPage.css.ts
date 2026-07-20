import { style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({
  minHeight: '100vh',
  background: vars.color.background,
  color: vars.color.text,
});

export const main = style({
  maxWidth: vars.layout.maxWidth,
  margin: '0 auto',
  padding: `${vars.space.xl} ${vars.space.md} ${vars.space.hero}`,
});

export const topBar = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: vars.space.xl,
  gap: vars.space.lg,
  flexWrap: 'wrap',
});

export const pageTitle = style({
  fontFamily: vars.font.display,
  fontSize: '40px',
  fontWeight: 500,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  '@media': { 'screen and (max-width: 640px)': { fontSize: '32px' } },
});

export const searchWrap = style({
  position: 'relative',
  width: '100%',
  maxWidth: '280px',
});

export const searchInput = style({
  width: '100%',
  background: vars.color.surface,
  border: vars.border.subtle,
  borderRadius: vars.radius.md,
  padding: `${vars.space.xs} ${vars.space.md} ${vars.space.xs} 40px`,
  color: vars.color.text,
  fontSize: '14px',
  fontFamily: vars.font.body,
  outline: 'none',
  transition: 'border-color 180ms ease',
  selectors: {
    '&:focus': { borderColor: vars.color.accent },
    '&::placeholder': { color: vars.color.textFaint },
  },
});

export const searchIcon = style({
  position: 'absolute',
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: vars.color.textFaint,
  pointerEvents: 'none',
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 3fr',
  gap: vars.space.xl,
  '@media': { 'screen and (max-width: 1024px)': { gridTemplateColumns: '1fr' } },
});

/* ── Sidebar ── */

export const sidebar = style({
  '@media': {
    'screen and (min-width: 1025px)': { position: 'sticky', top: '96px', alignSelf: 'start' },
  },
});

export const sidePanel = style({
  background: vars.color.surface,
  border: vars.border.subtle,
  borderRadius: vars.radius.xl,
  padding: vars.space.md,
});

export const sidePanelTitle = style({
  fontFamily: vars.font.display,
  fontSize: '20px',
  fontWeight: 500,
  marginBottom: vars.space.md,
});

export const catStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const catButton = style({
  width: '100%',
  textAlign: 'left',
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  color: vars.color.textMuted,
  fontSize: '13px',
  fontWeight: 500,
  fontFamily: vars.font.body,
  cursor: 'pointer',
  transition: 'all 140ms ease',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  selectors: {
    '&:hover': { background: vars.color.surfaceSoft, color: vars.color.text },
  },
});

export const catButtonActive = style({
  background: vars.color.accentWash,
  color: vars.color.text,
});

export const catChevron = style({ color: vars.color.accent });

/* ── Content ── */

export const contentArea = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
});

export const featuredBlock = style({
  background: `linear-gradient(135deg, ${vars.color.accentWash} 0%, ${vars.color.surface} 100%)`,
  border: vars.border.subtle,
  borderRadius: vars.radius.xl,
  padding: vars.space.lg,
});

export const blockTitle = style({
  fontFamily: vars.font.display,
  fontSize: '24px',
  fontWeight: 500,
  letterSpacing: '-0.02em',
  marginBottom: vars.space.md,
});

export const cardGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: vars.space.md,
  '@media': { 'screen and (max-width: 768px)': { gridTemplateColumns: '1fr' } },
});

export const collectionBlock = style({
  background: vars.color.surface,
  border: vars.border.subtle,
  borderRadius: vars.radius.xl,
  padding: vars.space.lg,
});

export const card = style({
  background: vars.color.surfaceSoft,
  border: vars.border.subtle,
  borderRadius: vars.radius.lg,
  padding: vars.space.md,
  display: 'flex',
  flexDirection: 'column',
  transition: 'background 180ms ease, border-color 180ms ease',
  selectors: {
    '&:hover': { background: vars.color.overlay, borderColor: vars.color.borderStrong },
  },
});

export const cardTitle = style({
  fontSize: '16px',
  fontWeight: 600,
  marginBottom: vars.space.xs,
  color: vars.color.text,
});

export const cardExcerpt = style({
  fontSize: '13px',
  lineHeight: 1.6,
  color: vars.color.textMuted,
  marginBottom: vars.space.md,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const cardFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 'auto',
  paddingTop: vars.space.md,
  borderTop: vars.border.subtle,
});

export const cardMeta = style({
  fontFamily: vars.font.mono,
  fontSize: '11px',
  color: vars.color.textFaint,
  letterSpacing: '0.04em',
});

export const cardActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
});

export const progressBar = style({
  position: 'relative',
  width: '96px',
  height: '4px',
  background: vars.color.surfaceSoft,
  borderRadius: vars.radius.pill,
  overflow: 'hidden',
});

export const progressFill = style({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  background: vars.color.accent,
  borderRadius: vars.radius.pill,
});

export const bookmarkBtn = style({
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: vars.color.textFaint,
  transition: 'color 140ms ease',
  selectors: { '&:hover': { color: vars.color.accent } },
});

export const bookmarkActive = style({ color: vars.color.accent });

export const emptyBlock = style({
  textAlign: 'center',
  padding: `${vars.space.xxl} 0`,
  background: vars.color.surface,
  border: vars.border.subtle,
  borderRadius: vars.radius.xl,
});

export const emptyTitle = style({
  fontSize: '20px',
  fontWeight: 600,
  fontFamily: vars.font.display,
});

export const emptyText = style({
  fontSize: '14px',
  color: vars.color.textMuted,
  marginTop: vars.space.xs,
});

export const errorText = style({ color: vars.color.accent });

/* ── Community Writings ── */

export const communitySection = style({ marginTop: vars.space.xxl });

export const communityHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: vars.space.lg,
});

export const communityTitleRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
});

export const communityIcon = style({ color: vars.color.accent });

export const uploadBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.xs} ${vars.space.md}`,
  background: vars.color.accent,
  color: vars.color.text,
  borderRadius: vars.radius.md,
  border: 'none',
  fontSize: '13px',
  fontWeight: 500,
  fontFamily: vars.font.body,
  cursor: 'pointer',
  transition: 'background 180ms ease',
  selectors: { '&:hover': { background: vars.color.accentHover } },
});

export const communityGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: vars.space.md,
  '@media': {
    'screen and (max-width: 1024px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
    'screen and (max-width: 640px)': { gridTemplateColumns: '1fr' },
  },
});

export const communityCard = style({
  background: vars.color.surfaceSoft,
  border: vars.border.subtle,
  borderRadius: vars.radius.lg,
  padding: vars.space.md,
  display: 'flex',
  flexDirection: 'column',
  transition: 'background 180ms ease, border-color 180ms ease',
  selectors: {
    '&:hover': { background: vars.color.overlay, borderColor: vars.color.borderStrong },
  },
});

export const communityCardTitle = style({
  fontSize: '16px',
  fontWeight: 600,
  marginBottom: vars.space.xxs,
  color: vars.color.text,
});

export const communityAuthors = style({
  fontSize: '13px',
  color: vars.color.textMuted,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xxs,
  marginBottom: vars.space.xs,
});

export const communityTag = style({
  display: 'inline-block',
  padding: `2px ${vars.space.xs}`,
  background: vars.color.accentWash,
  color: vars.color.accent,
  borderRadius: vars.radius.pill,
  fontSize: '11px',
  fontFamily: vars.font.mono,
  marginBottom: vars.space.xs,
});

export const communityFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 'auto',
  paddingTop: vars.space.sm,
  borderTop: vars.border.subtle,
});

export const communityDate = style({
  fontSize: '11px',
  color: vars.color.textFaint,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xxs,
});

export const saveBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xxs,
  padding: `${vars.space.xxs} ${vars.space.sm}`,
  borderRadius: vars.radius.md,
  border: 'none',
  fontSize: '12px',
  fontWeight: 500,
  fontFamily: vars.font.body,
  cursor: 'pointer',
  transition: 'all 140ms ease',
  background: vars.color.surfaceSoft,
  color: vars.color.textSoft,
  selectors: {
    '&:hover': { background: vars.color.accentWash, color: vars.color.accent },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

export const saveBtnSaved = style({
  background: 'rgba(45,138,78,0.16)',
  color: vars.color.success,
  selectors: {
    '&:hover': { background: vars.color.accentWash, color: vars.color.accent },
  },
});

export const loadingCenter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${vars.space.xxl} 0`,
});

export const spinner = style({
  color: vars.color.accent,
});
