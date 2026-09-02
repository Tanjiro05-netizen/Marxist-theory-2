import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '../styles/obsidianTheme.css.ts';

export const page = style({
  minHeight: '100vh',
  background: vars.color.background,
  color: vars.color.text,
});

export const main = style({
  maxWidth: vars.layout.maxWidth,
  margin: '0 auto',
  padding: `0 ${vars.space.md} ${vars.space.hero}`,
});

export const editorialNav = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.lg,
  minHeight: '58px',
  marginBottom: vars.space.xl,
  borderTop: vars.border.subtle,
  borderBottom: vars.border.subtle,
  '@media': {
    'screen and (max-width: 860px)': {
      alignItems: 'stretch',
      flexDirection: 'column',
      gap: 0,
      padding: `${vars.space.xs} 0`,
    },
  },
});

export const sectionTabs = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.lg,
  flex: 1,
  overflowX: 'auto',
  scrollbarWidth: 'none',
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  '@media': {
    'screen and (max-width: 860px)': {
      justifyContent: 'flex-start',
      gap: vars.space.md,
    },
  },
});

export const sectionTab = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '58px',
  padding: '0 0 2px',
  border: 0,
  borderBottom: '3px solid transparent',
  background: 'transparent',
  color: vars.color.textSoft,
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  transition: 'color 160ms ease, border-color 160ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
});

export const sectionTabActive = style({
  color: vars.color.text,
  borderBottomColor: vars.color.text,
});

export const navActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: vars.space.sm,
  flexWrap: 'wrap',
  '@media': {
    'screen and (max-width: 860px)': {
      justifyContent: 'flex-start',
      paddingBottom: vars.space.xs,
    },
  },
});

export const sourceLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  color: vars.color.textMuted,
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  transition: 'color 160ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
});

export const searchBand = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 420px) auto',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  marginBottom: vars.space.xl,
  '@media': {
    'screen and (max-width: 720px)': {
      gridTemplateColumns: '1fr',
      justifyContent: 'stretch',
    },
  },
});

export const header = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'end',
  gap: vars.space.lg,
  marginBottom: vars.space.xl,
  '@media': {
    'screen and (max-width: 760px)': {
      gridTemplateColumns: '1fr',
      alignItems: 'stretch',
    },
  },
});

export const eyebrow = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  marginBottom: vars.space.sm,
  color: vars.color.accent,
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

export const title = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '46px',
  fontWeight: 500,
  lineHeight: 1,
  letterSpacing: 0,
  '@media': {
    'screen and (max-width: 640px)': {
      fontSize: '34px',
    },
  },
});

export const subtitle = style({
  maxWidth: '720px',
  margin: `${vars.space.sm} 0 0`,
  color: vars.color.textMuted,
  fontSize: '14px',
  lineHeight: 1.7,
});

export const sourceActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: vars.space.sm,
  flexWrap: 'wrap',
  '@media': {
    'screen and (max-width: 760px)': {
      justifyContent: 'flex-start',
    },
  },
});

export const outlineLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  minHeight: '38px',
  padding: `${vars.space.xs} ${vars.space.md}`,
  borderRadius: vars.radius.sm,
  border: vars.border.subtle,
  color: vars.color.textSoft,
  background: vars.color.surface,
  fontSize: '13px',
  fontWeight: 600,
  transition: 'border-color 160ms ease, color 160ms ease, background 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: vars.color.borderAccent,
      color: vars.color.text,
      background: vars.color.surfaceRaised,
    },
  },
});

export const toolbar = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 1fr) auto',
  gap: vars.space.md,
  alignItems: 'center',
  marginBottom: vars.space.xl,
  '@media': {
    'screen and (max-width: 760px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const searchWrap = style({
  position: 'relative',
});

export const searchIcon = style({
  position: 'absolute',
  top: '50%',
  left: '12px',
  transform: 'translateY(-50%)',
  color: vars.color.textFaint,
  pointerEvents: 'none',
});

export const searchInput = style({
  width: '100%',
  minHeight: '42px',
  padding: `${vars.space.sm} ${vars.space.md} ${vars.space.sm} 40px`,
  borderRadius: vars.radius.sm,
  border: vars.border.subtle,
  outline: 'none',
  background: vars.color.surface,
  color: vars.color.text,
  fontSize: '14px',
  selectors: {
    '&:focus': {
      borderColor: vars.color.borderAccent,
    },
  },
});

export const filterRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: vars.space.xs,
  flexWrap: 'wrap',
  '@media': {
    'screen and (max-width: 760px)': {
      justifyContent: 'flex-start',
    },
  },
});

export const filterButton = style({
  minHeight: '34px',
  padding: `${vars.space.xxs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  border: vars.border.subtle,
  background: 'transparent',
  color: vars.color.textMuted,
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
  transition: 'all 160ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.text,
      borderColor: vars.color.borderStrong,
      background: vars.color.surfaceSoft,
    },
  },
});

export const filterButtonActive = style({
  color: vars.color.text,
  borderColor: vars.color.borderAccent,
  background: vars.color.accentSoft,
});

export const statusBar = style({
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.04em',
  textAlign: 'right',
  textTransform: 'uppercase',
  '@media': {
    'screen and (max-width: 720px)': {
      textAlign: 'left',
    },
  },
});

export const heroGrid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 0.92fr)',
  gap: vars.space.xl,
  alignItems: 'stretch',
  marginBottom: vars.space.xl,
  '@media': {
    'screen and (max-width: 1020px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const featuredStory = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.lg,
  minWidth: 0,
});

export const featuredImage = style({
  width: '100%',
  aspectRatio: '16 / 10.7',
  objectFit: 'cover',
  borderRadius: vars.radius.sm,
  background: vars.color.surfaceSoft,
});

export const featuredImageFallback = style({
  width: '100%',
  aspectRatio: '16 / 10.7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.sm,
  background: vars.color.surfaceSoft,
  color: vars.color.textFaint,
});

export const featuredCopy = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
  maxWidth: '720px',
  textAlign: 'center',
});

export const featuredTitle = style({
  margin: 0,
  color: vars.color.text,
  fontSize: '34px',
  fontWeight: 800,
  lineHeight: 1.1,
  letterSpacing: 0,
  overflowWrap: 'anywhere',
  '@media': {
    'screen and (max-width: 640px)': {
      fontSize: '28px',
    },
  },
});

export const featuredExcerpt = style({
  margin: 0,
  color: vars.color.textSoft,
  fontSize: '17px',
  lineHeight: 1.55,
});

export const storyMeta = style({
  margin: 0,
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.04em',
});

export const sideRail = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  minWidth: 0,
  paddingLeft: vars.space.lg,
  borderLeft: vars.border.subtle,
  '@media': {
    'screen and (max-width: 1020px)': {
      paddingLeft: 0,
      borderLeft: 0,
      borderTop: vars.border.subtle,
      paddingTop: vars.space.lg,
    },
  },
});

export const sideStory = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 150px',
  gap: vars.space.lg,
  alignItems: 'start',
  minHeight: '118px',
  transition: 'opacity 160ms ease',
  selectors: {
    '&:hover': {
      opacity: 0.78,
    },
  },
  '@media': {
    'screen and (max-width: 640px)': {
      gridTemplateColumns: '1fr',
      minHeight: 0,
    },
  },
});

export const sideStoryText = style({
  minWidth: 0,
});

export const sideTitle = style({
  margin: 0,
  color: vars.color.text,
  fontSize: '22px',
  fontWeight: 800,
  lineHeight: 1.15,
  letterSpacing: 0,
  overflowWrap: 'anywhere',
});

export const sideExcerpt = style({
  margin: `${vars.space.xs} 0 ${vars.space.sm}`,
  color: vars.color.textSoft,
  fontSize: '15px',
  lineHeight: 1.45,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const sideThumb = style({
  width: '100%',
  aspectRatio: '4 / 3.2',
  objectFit: 'cover',
  borderRadius: vars.radius.sm,
  background: vars.color.surfaceSoft,
  '@media': {
    'screen and (max-width: 640px)': {
      display: 'none',
    },
  },
});

export const popularSection = style({
  padding: `${vars.space.lg} 0 ${vars.space.xl}`,
  marginBottom: vars.space.xl,
  borderTop: vars.border.subtle,
  borderBottom: vars.border.subtle,
});

export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  marginBottom: vars.space.lg,
});

export const sectionTitle = style({
  margin: 0,
  color: vars.color.text,
  fontSize: '19px',
  fontWeight: 800,
  letterSpacing: 0,
});

export const viewAllLink = style({
  color: vars.color.textSoft,
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
});

export const popularRail = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: vars.space.lg,
  '@media': {
    'screen and (max-width: 1120px)': {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    },
    'screen and (max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const popularItem = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 76px',
  gap: vars.space.md,
  alignItems: 'center',
  minWidth: 0,
  paddingRight: vars.space.md,
  borderRight: vars.border.subtle,
  transition: 'opacity 160ms ease',
  selectors: {
    '&:hover': {
      opacity: 0.78,
    },
  },
  '@media': {
    'screen and (max-width: 720px)': {
      borderRight: 0,
      paddingRight: 0,
    },
  },
});

export const popularText = style({
  minWidth: 0,
});

export const popularTitle = style({
  margin: `0 0 ${vars.space.xs}`,
  color: vars.color.text,
  fontSize: '15px',
  fontWeight: 800,
  lineHeight: 1.25,
  overflowWrap: 'anywhere',
});

export const popularThumb = style({
  width: '76px',
  aspectRatio: '1',
  objectFit: 'cover',
  borderRadius: vars.radius.sm,
  background: vars.color.surfaceSoft,
});

export const popularThumbFallback = style({
  width: '76px',
  aspectRatio: '1',
  borderRadius: vars.radius.sm,
  background: vars.color.accentHover,
});

export const archiveSection = style({
  paddingTop: vars.space.md,
});

export const archiveCount = style({
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
});

export const archiveGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: vars.space.lg,
  '@media': {
    'screen and (max-width: 980px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    'screen and (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const archiveCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  minWidth: 0,
  transition: 'opacity 160ms ease',
  selectors: {
    '&:hover': {
      opacity: 0.8,
    },
  },
});

export const archiveImage = style({
  width: '100%',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
  borderRadius: vars.radius.sm,
  background: vars.color.surfaceSoft,
});

export const archiveImageFallback = style({
  width: '100%',
  aspectRatio: '16 / 9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.sm,
  background: vars.color.surfaceSoft,
  color: vars.color.textFaint,
});

export const archiveTitle = style({
  margin: 0,
  color: vars.color.text,
  fontSize: '19px',
  fontWeight: 800,
  lineHeight: 1.2,
  letterSpacing: 0,
  overflowWrap: 'anywhere',
});

export const archiveExcerpt = style({
  margin: 0,
  color: vars.color.textSoft,
  fontSize: '13px',
  lineHeight: 1.55,
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: vars.space.lg,
  '@media': {
    'screen and (max-width: 1060px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    'screen and (max-width: 680px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100%',
  overflow: 'hidden',
  borderRadius: vars.radius.md,
  border: vars.border.subtle,
  background: vars.color.surface,
  transition: 'border-color 180ms ease, transform 180ms ease',
  selectors: {
    '&:hover': {
      borderColor: vars.color.borderAccent,
      transform: 'translateY(-2px)',
    },
  },
});

export const cardImage = style({
  width: '100%',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
  background: vars.color.surfaceSoft,
});

export const cardImageFallback = style({
  width: '100%',
  aspectRatio: '16 / 9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: vars.color.surfaceSoft,
  color: vars.color.textFaint,
});

export const cardBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  flex: 1,
  padding: vars.space.md,
});

export const categoryRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  flexWrap: 'wrap',
});

export const category = style({
  display: 'inline-flex',
  alignItems: 'center',
  maxWidth: '100%',
  padding: `2px ${vars.space.xs}`,
  borderRadius: vars.radius.tiny,
  background: vars.color.accentWash,
  color: vars.color.accent,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  overflowWrap: 'anywhere',
});

export const cardTitle = style({
  margin: 0,
  color: vars.color.text,
  fontSize: '18px',
  fontWeight: 700,
  lineHeight: 1.25,
  overflowWrap: 'anywhere',
});

export const cardExcerpt = style({
  margin: 0,
  color: vars.color.textSoft,
  fontSize: '13px',
  lineHeight: 1.65,
  display: '-webkit-box',
  WebkitLineClamp: 4,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const cardFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderTop: vars.border.subtle,
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '11px',
});

export const readCue = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  color: vars.color.accent,
  fontFamily: vars.font.body,
  fontSize: '12px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
});

export const emptyState = style({
  padding: `${vars.space.xxl} ${vars.space.lg}`,
  borderRadius: vars.radius.md,
  border: vars.border.subtle,
  background: vars.color.surface,
  color: vars.color.textMuted,
  textAlign: 'center',
  fontSize: '14px',
  lineHeight: 1.7,
});

export const readerShell = style({
  maxWidth: '920px',
  margin: '0 auto',
  padding: `${vars.space.xl} ${vars.space.md} ${vars.space.hero}`,
});

export const backLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  marginBottom: vars.space.lg,
  color: vars.color.textMuted,
  fontSize: '13px',
  fontWeight: 600,
  transition: 'color 160ms ease',
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
});

export const articleHeader = style({
  paddingBottom: vars.space.xl,
  borderBottom: vars.border.subtle,
  marginBottom: vars.space.xl,
});

export const articleMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  flexWrap: 'wrap',
  marginTop: vars.space.lg,
  color: vars.color.textMuted,
  fontSize: '13px',
});

export const metaItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
});

export const articleTitle = style({
  margin: `${vars.space.sm} 0 0`,
  fontFamily: vars.font.display,
  fontSize: '52px',
  fontWeight: 500,
  lineHeight: 1.05,
  letterSpacing: 0,
  overflowWrap: 'anywhere',
  '@media': {
    'screen and (max-width: 640px)': {
      fontSize: '36px',
    },
  },
});

export const articleExcerpt = style({
  maxWidth: '760px',
  margin: `${vars.space.md} 0 0`,
  color: vars.color.textSoft,
  fontSize: '17px',
  lineHeight: 1.7,
});

export const articleImage = style({
  width: '100%',
  maxHeight: '520px',
  objectFit: 'cover',
  borderRadius: vars.radius.md,
  border: vars.border.subtle,
  marginBottom: vars.space.xl,
});

export const readerContent = style({
  color: vars.color.textSoft,
  fontSize: '17px',
  lineHeight: 1.8,
});

export const fallbackBody = style({
  padding: vars.space.lg,
  borderRadius: vars.radius.md,
  border: vars.border.subtle,
  background: vars.color.surface,
  color: vars.color.textSoft,
  lineHeight: 1.7,
});

export const readerFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  flexWrap: 'wrap',
  marginTop: vars.space.xl,
  paddingTop: vars.space.lg,
  borderTop: vars.border.subtle,
});

globalStyle(`${readerContent} p`, {
  margin: `0 0 ${vars.space.lg}`,
});

globalStyle(`${readerContent} h1, ${readerContent} h2, ${readerContent} h3`, {
  margin: `${vars.space.xl} 0 ${vars.space.md}`,
  color: vars.color.text,
  fontFamily: vars.font.display,
  fontWeight: 500,
  lineHeight: 1.2,
});

globalStyle(`${readerContent} h2`, {
  fontSize: '30px',
});

globalStyle(`${readerContent} h3`, {
  fontSize: '24px',
});

globalStyle(`${readerContent} a`, {
  color: vars.color.accent,
  textDecoration: 'underline',
  textDecorationThickness: '1px',
  textUnderlineOffset: '3px',
});

globalStyle(`${readerContent} img`, {
  display: 'block',
  maxWidth: '100%',
  height: 'auto',
  borderRadius: vars.radius.sm,
  margin: `${vars.space.xl} auto`,
});

globalStyle(`${readerContent} blockquote`, {
  margin: `${vars.space.lg} 0`,
  paddingLeft: vars.space.lg,
  borderLeft: vars.border.accent,
  color: vars.color.text,
});

globalStyle(`${readerContent} ul, ${readerContent} ol`, {
  paddingLeft: vars.space.lg,
  margin: `0 0 ${vars.space.lg}`,
});
