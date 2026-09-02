import { globalStyle, style } from '@vanilla-extract/css'
import { vars } from '../../styles/obsidianTheme.css.ts'

const buttonReset = {
  appearance: 'none',
  border: 0,
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
} as const

export const page = style({
  minHeight: 'calc(100vh - 64px)',
  background: vars.color.background,
  color: vars.color.text,
})

export const shell = style({
  width: '100%',
  maxWidth: '1240px',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 680px) 320px',
  gap: '28px',
  alignItems: 'start',
  padding: '20px 20px 56px',
  '@media': {
    'screen and (max-width: 980px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      padding: '12px 12px 48px',
    },
  },
})

export const mainColumn = style({
  minWidth: 0,
  borderLeft: vars.border.subtle,
  borderRight: vars.border.subtle,
  '@media': {
    'screen and (max-width: 760px)': {
      borderLeft: 0,
      borderRight: 0,
    },
  },
})

export const shellSocial = style({
  maxWidth: '1080px',
  gridTemplateColumns: 'minmax(0, 600px) 320px',
  gap: '24px',
  justifyContent: 'center',
  '@media': {
    'screen and (max-width: 980px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      padding: '0 0 44px',
    },
  },
})

export const shellBoards = style({
  maxWidth: '1420px',
  gridTemplateColumns: 'minmax(0, 1fr) 292px',
  gap: '22px',
  '@media': {
    'screen and (max-width: 980px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      padding: '10px 10px 44px',
    },
  },
})

export const mainColumnSocial = style({
  background: vars.color.background,
})

export const mainColumnBoards = style({
  border: vars.border.subtle,
  borderRadius: '0px',
  overflow: 'hidden',
  background: vars.color.surface,
  '@media': {
    'screen and (max-width: 760px)': {
      borderRadius: 0,
    },
  },
})

export const timelineHeader = style({
  position: 'sticky',
  top: '64px',
  zIndex: 8,
  padding: '14px 18px 0',
  background: 'rgba(9, 9, 9, 0.92)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  borderBottom: vars.border.subtle,
})

export const timelineHeaderSocial = style({
  padding: '12px 16px 0',
  background: 'rgba(9, 9, 9, 0.88)',
})

export const timelineHeaderBoards = style({
  position: 'relative',
  top: 0,
  padding: '16px 16px 0',
  background: vars.color.surfaceRaised,
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
})

export const headerTop = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px',
})

export const titleBlock = style({
  minWidth: 0,
})

globalStyle(`${titleBlock} h1`, {
  margin: 0,
  fontSize: '22px',
  lineHeight: 1.15,
  fontWeight: 700,
  letterSpacing: '0',
})

globalStyle(`${titleBlock} p`, {
  margin: '4px 0 0',
  color: vars.color.textFaint,
  fontSize: '12px',
  lineHeight: 1.4,
})

export const boardPicker = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '11px',
})

export const entityTabs = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '8px',
  marginBottom: '10px',
})

export const entityTab = style({
  ...buttonReset,
  minHeight: '38px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  border: vars.border.subtle,
  borderRadius: '0px',
  background: vars.color.surface,
  color: vars.color.textMuted,
  fontSize: '13px',
  fontWeight: 700,
  selectors: {
    '&:hover': {
      color: vars.color.text,
      borderColor: vars.color.borderStrong,
    },
  },
})

export const entityTabActive = style({
  color: vars.color.text,
  borderColor: vars.color.borderAccent,
  background: vars.color.accentWash,
})

export const tabs = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
})

export const tab = style({
  ...buttonReset,
  minHeight: '42px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  color: vars.color.textMuted,
  borderBottom: '2px solid transparent',
  fontSize: '13px',
  fontWeight: 600,
  selectors: {
    '&:hover': {
      color: vars.color.text,
      background: vars.color.surface,
    },
  },
})

export const tabActive = style({
  color: vars.color.text,
  borderBottomColor: vars.color.accent,
})

export const socialTopicDock = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  overflowX: 'auto',
  padding: '10px 0 12px',
  scrollbarWidth: 'none',
})

globalStyle(`${socialTopicDock}::-webkit-scrollbar`, {
  display: 'none',
})

export const socialTopicPill = style({
  flex: '0 0 auto',
  minHeight: '30px',
  display: 'inline-flex',
  alignItems: 'center',
  border: vars.border.subtle,
  borderRadius: '999px',
  background: vars.color.surface,
  color: vars.color.textMuted,
  padding: '0 11px',
  fontSize: '12px',
  fontWeight: 800,
  selectors: {
    '&:hover': {
      color: vars.color.text,
      borderColor: vars.color.borderStrong,
    },
  },
})

export const socialTopicPillActive = style({
  color: vars.color.text,
  borderColor: vars.color.borderAccent,
  background: vars.color.accentWash,
})

export const boardStrip = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  overflowX: 'auto',
  padding: '0 0 12px',
  scrollbarWidth: 'none',
})

globalStyle(`${boardStrip}::-webkit-scrollbar`, {
  display: 'none',
})

export const boardStripChip = style({
  ...buttonReset,
  flex: '0 0 auto',
  minHeight: '34px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  border: vars.border.subtle,
  borderRadius: '0px',
  background: vars.color.background,
  color: vars.color.textMuted,
  padding: '0 10px',
  fontFamily: vars.font.label,
  fontSize: '11px',
  selectors: {
    '&:hover': {
      color: vars.color.text,
      borderColor: vars.color.borderStrong,
    },
  },
})

globalStyle(`${boardStripChip} span`, {
  color: vars.color.textFaint,
  fontFamily: vars.font.body,
  fontSize: '11px',
})

export const boardStripChipActive = style({
  color: vars.color.text,
  borderColor: vars.color.borderAccent,
  background: vars.color.accentWash,
})

export const mobileSurfaceLink = style({
  display: 'none',
  minHeight: '34px',
  alignItems: 'center',
  justifyContent: 'center',
  border: vars.border.subtle,
  borderRadius: '999px',
  background: vars.color.surface,
  color: vars.color.textSoft,
  margin: '0 0 12px',
  padding: '0 12px',
  fontSize: '12px',
  fontWeight: 800,
  '@media': {
    'screen and (max-width: 980px)': {
      display: 'inline-flex',
    },
  },
})

export const composer = style({
  padding: '16px 18px',
  borderBottom: vars.border.subtle,
})

export const socialComposer = style({
  background: vars.color.background,
})

export const boardComposer = style({
  background: vars.color.surface,
})

export const composerGrid = style({
  display: 'grid',
  gridTemplateColumns: '44px minmax(0, 1fr)',
  gap: '12px',
})

export const avatar = style({
  width: '40px',
  height: '40px',
  borderRadius: '0px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  objectFit: 'cover',
  overflow: 'hidden',
  flexShrink: 0,
  border: vars.border.subtle,
  background: vars.color.surfaceSoft,
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '12px',
})

export const avatarAnon = style({
  background: vars.color.accentWash,
  borderColor: vars.color.borderAccent,
  color: vars.color.accent,
})

globalStyle(`${socialComposer} ${avatar}`, {
  borderRadius: '999px',
})

globalStyle(`${boardComposer} ${avatar}`, {
  borderRadius: '0px',
  fontFamily: vars.font.label,
})

export const composerBody = style({
  minWidth: 0,
})

export const composerTitleInput = style({
  width: '100%',
  minHeight: '34px',
  border: 0,
  outline: 0,
  background: 'transparent',
  color: vars.color.text,
  fontSize: '15px',
  fontWeight: 700,
  padding: '0 0 8px',
})

export const composerTextarea = style({
  width: '100%',
  minHeight: '92px',
  resize: 'vertical',
  border: 0,
  outline: 0,
  background: 'transparent',
  color: vars.color.text,
  fontSize: '18px',
  lineHeight: 1.45,
  padding: 0,
})

globalStyle(`${socialComposer} ${composerTextarea}`, {
  minHeight: '74px',
  fontSize: '20px',
})

globalStyle(`${boardComposer} ${composerTextarea}`, {
  minHeight: '112px',
  fontSize: '15px',
  fontFamily: vars.font.label,
})

globalStyle(`${composerTextarea}::placeholder`, {
  color: vars.color.textFaint,
})

export const composerControls = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  flexWrap: 'wrap',
  paddingTop: '12px',
  borderTop: vars.border.subtle,
})

export const socialComposerToolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  marginTop: '10px',
  paddingTop: '10px',
  borderTop: vars.border.subtle,
})

export const topicChipGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flexWrap: 'wrap',
})

export const composerToolLabel = style({
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0',
  textTransform: 'uppercase',
})

export const topicChip = style({
  ...buttonReset,
  minHeight: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  border: vars.border.subtle,
  borderRadius: '999px',
  background: vars.color.surface,
  color: vars.color.textMuted,
  padding: '0 10px',
  fontSize: '12px',
  fontWeight: 700,
  selectors: {
    '&:hover': {
      color: vars.color.text,
      borderColor: vars.color.borderStrong,
    },
    '&:disabled': {
      opacity: 0.45,
      cursor: 'not-allowed',
    },
  },
})

export const characterCount = style({
  flexShrink: 0,
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '11px',
})

export const boardComposerHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  marginBottom: '8px',
  color: vars.color.text,
})

globalStyle(`${boardComposerHeader} strong`, {
  fontFamily: vars.font.label,
  fontSize: '13px',
  textTransform: 'uppercase',
})

globalStyle(`${boardComposerHeader} span`, {
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '12px',
})

export const controlGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
})

export const selectLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  color: vars.color.textFaint,
  fontSize: '11px',
  fontFamily: vars.font.label,
})

export const guestComposerPrompt = style({
  minHeight: '82px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '14px',
  flexWrap: 'wrap',
})

export const guestComposerText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  color: vars.color.textMuted,
  fontSize: '13px',
  lineHeight: 1.45,
})

globalStyle(`${guestComposerText} strong`, {
  color: vars.color.text,
  fontSize: '16px',
  lineHeight: 1.2,
})

export const select = style({
  minHeight: '34px',
  maxWidth: '170px',
  border: vars.border.subtle,
  borderRadius: '0px',
  background: vars.color.surface,
  color: vars.color.textSoft,
  padding: '0 10px',
  fontSize: '12px',
})

export const toggleLabel = style({
  minHeight: '34px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  border: vars.border.subtle,
  borderRadius: '0px',
  background: vars.color.surface,
  color: vars.color.textMuted,
  padding: '0 10px',
  fontSize: '12px',
})

export const anonInput = style({
  width: '132px',
  minHeight: '34px',
  border: vars.border.subtle,
  borderRadius: '0px',
  background: vars.color.surface,
  color: vars.color.text,
  padding: '0 10px',
  outline: 0,
  fontSize: '12px',
})

export const submitButton = style({
  ...buttonReset,
  minHeight: '36px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  borderRadius: '999px',
  background: vars.color.accent,
  color: vars.color.text,
  padding: '0 16px',
  fontSize: '13px',
  fontWeight: 700,
  selectors: {
    '&:hover': {
      background: vars.color.accentHover,
    },
    '&:disabled': {
      opacity: 0.45,
      cursor: 'not-allowed',
    },
  },
})

export const formError = style({
  marginTop: '10px',
  color: vars.color.warning,
  fontSize: '12px',
})

export const feedList = style({
  display: 'flex',
  flexDirection: 'column',
})

export const boardCatalog = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(238px, 1fr))',
  gap: '10px',
  padding: '10px',
  borderBottom: vars.border.subtle,
  '@media': {
    'screen and (max-width: 700px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
})

export const topicSpotlight = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  borderBottom: vars.border.subtle,
  background: `${vars.color.surface}`,
  padding: '14px 18px',
  '@media': {
    'screen and (max-width: 620px)': {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
})

globalStyle(`${topicSpotlight} span`, {
  display: 'block',
  color: vars.color.accent,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 800,
  textTransform: 'uppercase',
})

globalStyle(`${topicSpotlight} h2`, {
  margin: '3px 0 0',
  color: vars.color.text,
  fontSize: '18px',
  lineHeight: 1.2,
})

globalStyle(`${topicSpotlight} p`, {
  margin: '4px 0 0',
  color: vars.color.textMuted,
  fontSize: '12px',
  lineHeight: 1.35,
})

export const topicStats = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  marginTop: '10px',
})

globalStyle(`${topicStats} strong`, {
  minHeight: '24px',
  display: 'inline-flex',
  alignItems: 'center',
  border: vars.border.subtle,
  borderRadius: '999px',
  background: vars.color.background,
  color: vars.color.textMuted,
  padding: '0 8px',
  fontFamily: vars.font.label,
  fontSize: '10px',
})

export const topicSpotlightActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
  flexWrap: 'wrap',
})

globalStyle(`${topicSpotlightActions} a`, {
  minHeight: '30px',
  display: 'inline-flex',
  alignItems: 'center',
  border: vars.border.subtle,
  borderRadius: '999px',
  background: vars.color.background,
  color: vars.color.textSoft,
  padding: '0 10px',
  fontSize: '12px',
  fontWeight: 800,
})

export const postCard = style({
  display: 'grid',
  gridTemplateColumns: '44px minmax(0, 1fr)',
  gap: '12px',
  padding: '16px 18px',
  borderBottom: vars.border.subtle,
  background: vars.color.background,
  selectors: {
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.018)',
    },
  },
})

export const socialPostCard = style({
  background: vars.color.background,
  selectors: {
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.028)',
    },
  },
})

globalStyle(`${socialPostCard} ${avatar}`, {
  borderRadius: '999px',
})

export const boardPostCard = style({
  gridTemplateColumns: '38px minmax(0, 1fr)',
  gap: '10px',
  margin: '10px',
  border: vars.border.subtle,
  borderRadius: '0px',
  background: vars.color.background,
  selectors: {
    '&:hover': {
      borderColor: vars.color.borderStrong,
      background: vars.color.surfaceRaised,
    },
  },
})

globalStyle(`${boardPostCard} ${avatar}`, {
  width: '34px',
  height: '34px',
  borderRadius: '0px',
  fontSize: '11px',
})

export const postBody = style({
  minWidth: 0,
})

export const repostBanner = style({
  gridColumn: '2',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  color: vars.color.textFaint,
  fontSize: '12px',
  marginBottom: '6px',
})

export const identityLine = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minWidth: 0,
  color: vars.color.textFaint,
  fontSize: '13px',
})

export const displayName = style({
  color: vars.color.text,
  fontWeight: 700,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const handle = style({
  color: vars.color.textFaint,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const boardBadge = style({
  ...buttonReset,
  minHeight: '24px',
  display: 'inline-flex',
  alignItems: 'center',
  border: vars.border.accent,
  borderRadius: '999px',
  background: vars.color.accentWash,
  color: vars.color.accent,
  padding: '0 8px',
  fontFamily: vars.font.label,
  fontSize: '10px',
})

export const postTitle = style({
  margin: '8px 0 0',
  color: vars.color.text,
  fontSize: '16px',
  lineHeight: 1.3,
  fontWeight: 800,
})

globalStyle(`${boardPostCard} ${postTitle}`, {
  fontSize: '15px',
  fontFamily: vars.font.label,
  fontWeight: 800,
})

export const postContent = style({
  margin: '8px 0 0',
  color: vars.color.textSoft,
  fontSize: '15px',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
})

globalStyle(`${boardPostCard} ${postContent}`, {
  fontSize: '14px',
  lineHeight: 1.45,
})

export const embeddedPost = style({
  marginTop: '12px',
  border: vars.border.subtle,
  borderRadius: '0px',
  padding: '12px',
  background: vars.color.surface,
})

export const actions = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '8px',
  marginTop: '12px',
  maxWidth: '420px',
})

export const socialActions = style({
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  maxWidth: '430px',
})

export const boardActions = style({
  gridTemplateColumns: 'repeat(2, max-content)',
  gap: '14px',
  maxWidth: 'none',
  borderTop: vars.border.subtle,
  paddingTop: '10px',
})

export const actionButton = style({
  ...buttonReset,
  minWidth: 0,
  minHeight: '32px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '7px',
  color: vars.color.textFaint,
  borderRadius: '999px',
  fontSize: '12px',
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
})

globalStyle(`${boardActions} ${actionButton}`, {
  minHeight: '26px',
  fontFamily: vars.font.label,
  fontSize: '11px',
})

export const actionActive = style({
  color: vars.color.accent,
})

export const threadCard = style({
  minHeight: '220px',
  display: 'flex',
  flexDirection: 'column',
  border: vars.border.subtle,
  borderRadius: '0px',
  background: vars.color.background,
  padding: '12px',
  selectors: {
    '&:hover': {
      borderColor: vars.color.borderStrong,
      background: vars.color.surfaceRaised,
    },
  },
})

export const threadCardHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '10px',
})

export const threadBoardTag = style({
  ...buttonReset,
  minHeight: '24px',
  display: 'inline-flex',
  alignItems: 'center',
  border: vars.border.accent,
  borderRadius: '999px',
  background: vars.color.accentWash,
  color: vars.color.accent,
  padding: '0 8px',
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 800,
})

export const threadTitleButton = style({
  ...buttonReset,
  minWidth: 0,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '8px',
  marginTop: '12px',
  color: vars.color.text,
  textAlign: 'left',
})

globalStyle(`${threadTitleButton} strong`, {
  minWidth: 0,
  fontFamily: vars.font.label,
  fontSize: '15px',
  lineHeight: 1.3,
  overflowWrap: 'anywhere',
})

globalStyle(`${threadTitleButton} svg`, {
  flexShrink: 0,
  marginTop: '2px',
  color: vars.color.textFaint,
})

export const threadExcerpt = style({
  margin: '10px 0 0',
  color: vars.color.textSoft,
  fontSize: '13px',
  lineHeight: 1.45,
  overflowWrap: 'anywhere',
})

export const threadMetaGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '4px',
  marginTop: 'auto',
  paddingTop: '14px',
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '10px',
})

export const threadFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  marginTop: '10px',
  paddingTop: '10px',
  borderTop: vars.border.subtle,
})

export const threadStatButton = style({
  ...buttonReset,
  minHeight: '26px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '11px',
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
})

export const stateBlock = style({
  minHeight: '180px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.textMuted,
  borderBottom: vars.border.subtle,
  padding: '24px',
  textAlign: 'center',
})

export const retryButton = style({
  ...buttonReset,
  marginTop: '12px',
  minHeight: '34px',
  borderRadius: '999px',
  border: vars.border.subtle,
  background: vars.color.surface,
  padding: '0 14px',
  color: vars.color.text,
})

export const rail = style({
  position: 'sticky',
  top: '84px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  '@media': {
    'screen and (max-width: 980px)': {
      display: 'none',
    },
  },
})

export const railSection = style({
  border: vars.border.subtle,
  borderRadius: '0px',
  background: vars.color.surface,
  overflow: 'hidden',
})

export const surfaceReferenceLink = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  padding: '14px',
  color: vars.color.textMuted,
  selectors: {
    '&:hover': {
      color: vars.color.text,
      background: vars.color.surfaceRaised,
    },
  },
})

export const socialSearchBox = style({
  minHeight: '42px',
  display: 'grid',
  gridTemplateColumns: '18px minmax(0, 1fr)',
  alignItems: 'center',
  gap: '8px',
  padding: '0 12px',
  borderBottom: vars.border.subtle,
  color: vars.color.textFaint,
})

globalStyle(`${socialSearchBox} input`, {
  width: '100%',
  border: 0,
  outline: 0,
  background: 'transparent',
  color: vars.color.text,
  fontSize: '13px',
})

export const discoveryCategoryGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '8px',
  padding: '12px',
  borderBottom: vars.border.subtle,
})

export const discoveryCategoryButton = style({
  ...buttonReset,
  minWidth: 0,
  minHeight: '44px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  border: vars.border.subtle,
  borderRadius: '0px',
  background: vars.color.background,
  color: vars.color.textMuted,
  padding: '6px',
  selectors: {
    '&:hover': {
      color: vars.color.text,
      borderColor: vars.color.borderStrong,
    },
  },
})

globalStyle(`${discoveryCategoryButton} strong`, {
  color: 'inherit',
  fontSize: '13px',
  lineHeight: 1.1,
})

globalStyle(`${discoveryCategoryButton} span`, {
  marginTop: '3px',
  color: vars.color.textFaint,
  fontSize: '10px',
  lineHeight: 1.1,
})

export const discoveryCategoryButtonActive = style({
  color: vars.color.text,
  borderColor: vars.color.borderAccent,
  background: vars.color.accentWash,
})

export const hotSearchList = style({
  display: 'flex',
  flexDirection: 'column',
})

export const hotSearchItem = style({
  display: 'grid',
  gridTemplateColumns: '42px minmax(0, 1fr) auto',
  gap: '8px',
  padding: '11px 14px',
  borderBottom: vars.border.subtle,
  color: vars.color.textMuted,
  selectors: {
    '&:hover': {
      background: vars.color.surfaceRaised,
      color: vars.color.text,
    },
  },
})

export const hotSearchItemActive = style({
  background: vars.color.accentWash,
})

globalStyle(`${hotSearchItem} span`, {
  color: vars.color.accent,
  fontFamily: vars.font.label,
  fontSize: '11px',
  fontWeight: 800,
})

globalStyle(`${hotSearchItem} strong`, {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.color.text,
  fontSize: '13px',
})

globalStyle(`${hotSearchItem} small`, {
  gridColumn: '2',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.color.textFaint,
  fontSize: '11px',
})

globalStyle(`${hotSearchItem} em`, {
  gridColumn: '3',
  gridRow: '1 / span 3',
  alignSelf: 'center',
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontStyle: 'normal',
})

globalStyle(`${hotSearchItem} b`, {
  gridColumn: '2',
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 500,
})

export const hotSearchEmpty = style({
  padding: '14px',
  color: vars.color.textFaint,
  fontSize: '12px',
})

export const superTopicList = style({
  display: 'flex',
  flexDirection: 'column',
})

export const superTopicItem = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '10px',
  alignItems: 'center',
  padding: '12px 14px',
  borderBottom: vars.border.subtle,
  selectors: {
    '&:hover': {
      background: vars.color.surfaceRaised,
    },
  },
})

export const superTopicItemActive = style({
  background: vars.color.accentWash,
})

globalStyle(`${superTopicItem} strong`, {
  display: 'block',
  color: vars.color.text,
  fontSize: '13px',
  lineHeight: 1.2,
})

globalStyle(`${superTopicItem} span`, {
  display: 'block',
  marginTop: '3px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.color.textFaint,
  fontSize: '11px',
})

export const superTopicBoardLink = style({
  minHeight: '26px',
  display: 'inline-flex',
  alignItems: 'center',
  border: vars.border.subtle,
  borderRadius: '999px',
  color: vars.color.textMuted,
  padding: '0 8px',
  fontFamily: vars.font.label,
  fontSize: '10px',
})

export const pulsePanel = style({
  padding: '14px',
})

globalStyle(`${pulsePanel} strong`, {
  color: vars.color.text,
  fontSize: '15px',
})

globalStyle(`${pulsePanel} p`, {
  margin: '6px 0 12px',
  color: vars.color.textMuted,
  fontSize: '12px',
  lineHeight: 1.4,
})

globalStyle(`${pulsePanel} div`, {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '10px',
})

globalStyle(`${surfaceReferenceLink} span`, {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  color: vars.color.text,
  fontSize: '14px',
  fontWeight: 800,
})

globalStyle(`${surfaceReferenceLink} small`, {
  color: vars.color.textFaint,
  fontSize: '12px',
  lineHeight: 1.35,
})

export const railHeader = style({
  minHeight: '46px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  padding: '0 14px',
  borderBottom: vars.border.subtle,
  color: vars.color.text,
  fontSize: '14px',
  fontWeight: 700,
})

export const suggestionList = style({
  display: 'flex',
  flexDirection: 'column',
})

export const suggestionItem = style({
  display: 'grid',
  gridTemplateColumns: '36px minmax(0, 1fr) auto',
  gap: '10px',
  alignItems: 'center',
  padding: '12px 14px',
  borderBottom: vars.border.subtle,
})

export const suggestionText = style({
  minWidth: 0,
})

globalStyle(`${suggestionText} strong`, {
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.color.text,
  fontSize: '13px',
})

globalStyle(`${suggestionText} span`, {
  display: 'block',
  marginTop: '2px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.color.textFaint,
  fontSize: '11px',
})

export const followButton = style({
  ...buttonReset,
  minHeight: '30px',
  borderRadius: '999px',
  background: vars.color.text,
  color: vars.color.background,
  padding: '0 12px',
  fontSize: '12px',
  fontWeight: 800,
  selectors: {
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
})

export const followButtonFollowing = style({
  background: vars.color.surfaceSoft,
  color: vars.color.text,
  border: vars.border.subtle,
})

export const boardList = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '8px',
  padding: '12px',
})

export const boardChip = style({
  ...buttonReset,
  minHeight: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  borderRadius: '0px',
  border: vars.border.subtle,
  background: vars.color.background,
  color: vars.color.textMuted,
  padding: '0 10px',
  fontSize: '12px',
  selectors: {
    '&:hover': {
      color: vars.color.text,
      borderColor: vars.color.borderStrong,
    },
  },
})

export const boardChipActive = style({
  color: vars.color.text,
  borderColor: vars.color.borderAccent,
  background: vars.color.accentWash,
})

export const pagination = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  padding: '18px',
  borderBottom: vars.border.subtle,
})

export const pageButton = style({
  ...buttonReset,
  minHeight: '34px',
  borderRadius: '999px',
  border: vars.border.subtle,
  background: vars.color.surface,
  color: vars.color.text,
  padding: '0 14px',
  fontSize: '12px',
  selectors: {
    '&:disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
  },
})

export const monoMeta = style({
  fontFamily: vars.font.label,
  fontSize: '11px',
  color: vars.color.textFaint,
})

export const weiboPage = style({
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #10131b 0%, #0b0d12 420px, #0b0d12 100%)',
})

export const weiboTopbar = style({
  position: 'sticky',
  top: 0,
  zIndex: 20,
  minHeight: '56px',
  display: 'grid',
  gridTemplateColumns: '184px minmax(190px, 320px) minmax(260px, 1fr) auto',
  alignItems: 'center',
  gap: '16px',
  borderBottom: '1px solid rgba(226,61,61,0.18)',
  background: 'rgba(13, 16, 19, 0.96)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  padding: '0 22px',
  '@media': {
    'screen and (max-width: 900px)': {
      top: 0,
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      gap: '10px',
      padding: '0 12px',
    },
  },
})

export const weiboBrand = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '9px',
  minWidth: 0,
  color: vars.color.text,
})

export const weiboMark = style({
  width: '34px',
  height: '34px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0px',
  background: '#b3122e',
  color: '#0b0d12',
  fontFamily: vars.font.label,
  fontSize: '17px',
  fontWeight: 900,
  transform: 'rotate(-6deg)',
})

globalStyle(`${weiboBrand} strong`, {
  display: 'block',
  color: vars.color.text,
  fontSize: '18px',
  lineHeight: 1.05,
})

globalStyle(`${weiboBrand} small`, {
  display: 'block',
  color: vars.color.textFaint,
  fontSize: '10px',
  lineHeight: 1.1,
})

export const weiboGlobalSearch = style({
  minHeight: '38px',
  display: 'grid',
  gridTemplateColumns: '20px minmax(0, 1fr)',
  alignItems: 'center',
  gap: '8px',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0px',
  background: '#151924',
  color: vars.color.textFaint,
  padding: '0 14px',
  '@media': {
    'screen and (max-width: 900px)': {
      display: 'none',
    },
  },
})

globalStyle(`${weiboGlobalSearch} input`, {
  width: '100%',
  border: 0,
  outline: 0,
  background: 'transparent',
  color: vars.color.text,
  fontSize: '14px',
})

export const weiboTopNav = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(44px, 1fr))',
  alignItems: 'stretch',
  justifySelf: 'center',
  minWidth: '360px',
  height: '56px',
  '@media': {
    'screen and (max-width: 1100px)': {
      minWidth: '260px',
    },
    'screen and (max-width: 900px)': {
      display: 'none',
    },
  },
})

globalStyle(`${weiboTopNav} a`, {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.textMuted,
})

globalStyle(`${weiboTopNav} a:hover`, {
  color: vars.color.text,
})

export const weiboTopNavActive = style({
  color: '#d8c79f',
  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      left: '22%',
      right: '22%',
      bottom: 0,
      height: '3px',
      borderRadius: '999px 999px 0 0',
      background: '#d41f3d',
    },
  },
})

export const weiboTopActions = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '12px',
})

export const weiboLoginButton = style({
  minHeight: '34px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0px',
  background: '#d41f3d',
  color: '#fff',
  padding: '0 18px',
  fontSize: '13px',
  fontWeight: 800,
})

export const weiboRegisterLink = style({
  color: vars.color.textMuted,
  fontSize: '13px',
  '@media': {
    'screen and (max-width: 900px)': {
      display: 'none',
    },
  },
})

export const weiboIconButton = style({
  ...buttonReset,
  width: '34px',
  height: '34px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0px',
  background: '#1a1f2b',
  color: vars.color.textMuted,
  '@media': {
    'screen and (max-width: 900px)': {
      display: 'none',
    },
  },
})

export const weiboComposeButton = style({
  ...buttonReset,
  width: '36px',
  height: '36px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0px',
  background: '#d8c79f',
  color: '#0b0d12',
})

export const weiboShell = style({
  width: '100%',
  maxWidth: '1520px',
  display: 'grid',
  gridTemplateColumns: '220px minmax(0, 760px) 340px',
  gap: '12px',
  margin: '0 auto',
  padding: '0 20px 72px',
  '@media': {
    'screen and (max-width: 1240px)': {
      gridTemplateColumns: '190px minmax(0, 1fr) 320px',
      padding: '0 12px 64px',
    },
    'screen and (max-width: 1080px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 310px',
    },
    'screen and (max-width: 820px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      padding: '0 0 54px',
    },
  },
})

export const weiboLeftRail = style({
  position: 'sticky',
  top: '72px',
  alignSelf: 'start',
  minHeight: 'calc(100vh - 72px)',
  borderLeft: '1px solid rgba(255,255,255,0.05)',
  borderRight: '1px solid rgba(226,61,61,0.14)',
  background: 'rgba(13, 16, 19, 0.72)',
  padding: '28px 18px',
  '@media': {
    'screen and (max-width: 1080px)': {
      display: 'none',
    },
  },
})

export const weiboLeftNavGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
})

export const weiboLeftNavItem = style({
  ...buttonReset,
  minHeight: '32px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '12px',
  color: vars.color.textMuted,
  fontSize: '15px',
  fontWeight: 800,
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
})

export const weiboLeftNavItemActive = style({
  color: '#d8c79f',
})

export const weiboLeftCategoryList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  marginTop: '30px',
  paddingLeft: '8px',
})

export const weiboLeftCategoryItem = style({
  ...buttonReset,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '12px',
  color: vars.color.textMuted,
  fontSize: '15px',
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
})

export const weiboLeftCategoryItemActive = style({
  color: '#4a7fb5',
})

export const weiboMainFeed = style({
  minWidth: 0,
  paddingTop: '0',
})

export const weiboFeedTabs = style({
  position: 'sticky',
  top: '56px',
  zIndex: 8,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  minHeight: '48px',
  borderLeft: vars.border.subtle,
  borderRight: vars.border.subtle,
  borderBottom: vars.border.subtle,
  background: 'rgba(10, 12, 15, 0.94)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  '@media': {
    'screen and (max-width: 820px)': {
      top: '56px',
      borderLeft: 0,
      borderRight: 0,
    },
  },
})

globalStyle(`${weiboFeedTabs} ${tab}`, {
  minHeight: '48px',
})

globalStyle(`${weiboFeedTabs} ${tabActive}`, {
  color: '#d8c79f',
  borderBottomColor: '#d41f3d',
})

export const signalBriefing = style({
  borderLeft: vars.border.subtle,
  borderRight: vars.border.subtle,
  borderBottom: vars.border.subtle,
  background: 'rgba(179,18,46,0.08)',
  padding: '14px',
})

export const signalBriefingHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  marginBottom: '12px',
})

globalStyle(`${signalBriefingHeader} span`, {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  color: '#d8c79f',
  fontSize: '12px',
  fontWeight: 900,
  textTransform: 'uppercase',
})

globalStyle(`${signalBriefingHeader} a`, {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  color: vars.color.textMuted,
  fontSize: '12px',
  fontWeight: 800,
})

export const signalBriefingLead = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '14px',
  alignItems: 'end',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0px',
  background: 'rgba(7, 9, 12, 0.58)',
  padding: '14px',
  '@media': {
    'screen and (max-width: 620px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
})

globalStyle(`${signalBriefingLead} small`, {
  display: 'block',
  color: '#4a7fb5',
  fontFamily: vars.font.label,
  fontSize: '10px',
  fontWeight: 900,
  textTransform: 'uppercase',
})

globalStyle(`${signalBriefingLead} strong`, {
  display: 'block',
  marginTop: '4px',
  color: vars.color.text,
  fontSize: '21px',
  lineHeight: 1.12,
})

globalStyle(`${signalBriefingLead} span`, {
  display: 'block',
  marginTop: '6px',
  color: vars.color.textMuted,
  fontSize: '13px',
  lineHeight: 1.45,
})

export const signalBriefingMetrics = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(70px, 1fr))',
  gap: '8px',
})

globalStyle(`${signalBriefingMetrics} span`, {
  marginTop: 0,
  minHeight: '54px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0px',
  background: '#10131b',
  color: vars.color.textFaint,
  padding: '0 10px',
  fontSize: '11px',
})

globalStyle(`${signalBriefingMetrics} b`, {
  color: '#d8c79f',
  fontFamily: vars.font.label,
  fontSize: '15px',
})

export const signalBriefingGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '8px',
  marginTop: '8px',
  '@media': {
    'screen and (max-width: 620px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
})

globalStyle(`${signalBriefingGrid} a`, {
  minWidth: 0,
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0px',
  background: 'rgba(7, 9, 12, 0.48)',
  padding: '10px',
})

globalStyle(`${signalBriefingGrid} strong`, {
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.color.text,
  fontSize: '13px',
})

globalStyle(`${signalBriefingGrid} span`, {
  display: 'block',
  marginTop: '4px',
  color: vars.color.textFaint,
  fontSize: '11px',
})

globalStyle(`${weiboMainFeed} ${socialTopicDock}`, {
  borderLeft: vars.border.subtle,
  borderRight: vars.border.subtle,
  background: '#10131b',
  paddingLeft: '14px',
  paddingRight: '14px',
})

globalStyle(`${weiboMainFeed} ${composer}`, {
  borderLeft: vars.border.subtle,
  borderRight: vars.border.subtle,
  background: '#10131b',
})

globalStyle(`${weiboMainFeed} ${postCard}`, {
  marginTop: '10px',
  border: vars.border.subtle,
  borderRadius: '0px',
  background: '#10131b',
  padding: '20px 26px',
})

globalStyle(`${weiboMainFeed} ${socialPostCard}:hover`, {
  background: '#151924',
})

globalStyle(`${weiboMainFeed} ${displayName}`, {
  fontSize: '15px',
})

globalStyle(`${weiboMainFeed} ${boardBadge}`, {
  color: '#d8c79f',
  borderColor: 'rgba(241,207,116,0.34)',
  background: 'rgba(241,207,116,0.09)',
})

globalStyle(`${weiboMainFeed} ${postContent}`, {
  fontSize: '16px',
  lineHeight: 1.65,
})

globalStyle(`${weiboMainFeed} ${actionButton}`, {
  justifyContent: 'center',
  color: vars.color.textMuted,
})

export const weiboRightRail = style({
  position: 'sticky',
  top: '72px',
  alignSelf: 'start',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  maxHeight: 'calc(100vh - 84px)',
  overflowY: 'auto',
  paddingTop: '18px',
  '@media': {
    'screen and (max-width: 820px)': {
      display: 'none',
    },
  },
})

export const weiboHotPanel = style({
  border: vars.border.subtle,
  borderRadius: '0px',
  background: '#10131b',
  overflow: 'hidden',
})

export const weiboHotHeader = style({
  minHeight: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '0 14px',
})

globalStyle(`${weiboHotHeader} h2`, {
  margin: 0,
  color: vars.color.text,
  fontSize: '17px',
})

globalStyle(`${weiboHotHeader} button`, {
  ...buttonReset,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  color: vars.color.textFaint,
  fontSize: '12px',
})

export const weiboHotTabs = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '8px',
  padding: '0 14px 12px',
})

globalStyle(`${weiboHotTabs} button`, {
  ...buttonReset,
  minHeight: '34px',
  borderRadius: '0px',
  background: '#10131b',
  color: vars.color.textMuted,
  fontSize: '13px',
})

export const weiboHotTabActive = style({
  color: vars.color.text,
  background: '#1a1f2b',
})

export const weiboHotRankList = style({
  display: 'flex',
  flexDirection: 'column',
  padding: '6px 14px 12px',
})

export const weiboHotRankItem = style({
  minHeight: '36px',
  display: 'grid',
  gridTemplateColumns: '24px minmax(0, 1fr) auto 20px',
  alignItems: 'center',
  gap: '8px',
  color: vars.color.textMuted,
  fontSize: '14px',
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
})

globalStyle(`${weiboHotRankItem} span`, {
  color: '#d8c79f',
  fontFamily: vars.font.label,
  fontSize: '16px',
  fontWeight: 800,
})

globalStyle(`${weiboHotRankItem} strong`, {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 600,
})

globalStyle(`${weiboHotRankItem} em`, {
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '12px',
  fontStyle: 'normal',
})

globalStyle(`${weiboHotRankItem} b`, {
  minWidth: '26px',
  height: '18px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0px',
  background: '#d41f3d',
  color: '#fff',
  padding: '0 4px',
  fontSize: '10px',
})

export const weiboHotRankItemActive = style({
  color: '#d8c79f',
})

export const weiboFullHotLink = style({
  minHeight: '44px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  margin: '0 14px 14px',
  borderRadius: '0px',
  background: '#10131b',
  color: vars.color.textMuted,
  fontSize: '13px',
})

export const weiboUtilityLinks = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '12px 20px',
  padding: '24px 4px',
  color: vars.color.textFaint,
  fontSize: '11px',
})
