import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '../../styles/obsidianTheme.css.ts';

const subtleButton = {
  appearance: 'none',
  border: 0,
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
} as const;

export const page = style({
  minHeight: '100vh',
  background: vars.color.background,
  color: vars.color.text,
});

export const appShell = style({
  width: '100%',
  maxWidth: '1280px',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: '248px minmax(0, 1fr) 300px',
  gap: '20px',
  alignItems: 'start',
  padding: '20px 20px 40px',
  '@media': {
    'screen and (max-width: 1180px)': {
      gridTemplateColumns: '232px minmax(0, 1fr)',
    },
    'screen and (max-width: 900px)': {
      display: 'block',
      padding: '12px 12px 86px',
    },
  },
});

export const leftRail = style({
  position: 'sticky',
  top: '16px',
  minWidth: 0,
  '@media': {
    'screen and (max-width: 900px)': {
      display: 'none',
    },
  },
});

export const railHeader = style({
  padding: '0 0 12px',
  borderBottom: vars.border.subtle,
  marginBottom: '12px',
});

export const brandButton = style({
  ...subtleButton,
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 6px',
  borderRadius: '0px',
  selectors: {
    '&:hover': {
      background: vars.color.surfaceSoft,
    },
  },
});

export const brandMark = style({
  width: '34px',
  height: '34px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0px',
  background: vars.color.accentWash,
  border: vars.border.accent,
  color: vars.color.accent,
  flexShrink: 0,
});

export const brandTitle = style({
  display: 'block',
  fontFamily: vars.font.display,
  fontSize: '28px',
  lineHeight: 1,
  fontWeight: 600,
  textAlign: 'left',
});

export const brandMeta = style({
  display: 'block',
  marginTop: '4px',
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  textAlign: 'left',
});

export const boardNav = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const boardNavItem = style({
  ...subtleButton,
  width: '100%',
  minHeight: '46px',
  display: 'grid',
  gridTemplateColumns: '34px minmax(0, 1fr) 16px',
  gap: '10px',
  alignItems: 'center',
  padding: '7px 8px',
  borderRadius: '0px',
  color: vars.color.textMuted,
  textAlign: 'left',
  selectors: {
    '&:hover': {
      background: vars.color.surfaceSoft,
      color: vars.color.text,
    },
  },
});

export const boardNavItemActive = style({
  background: vars.color.accentWash,
  color: vars.color.text,
  boxShadow: `inset 0 0 0 1px ${vars.color.borderAccent}`,
});

export const boardNavIcon = style({
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0px',
  background: vars.color.surfaceSoft,
  color: vars.color.textSoft,
});

export const boardNavText = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
});

globalStyle(`${boardNavText} span:first-child`, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '13px',
  color: vars.color.text,
});

globalStyle(`${boardNavText} span:last-child`, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.04em',
  color: vars.color.textFaint,
});

export const boardSlug = style({
  width: '34px',
  fontFamily: vars.font.label,
  fontSize: '12px',
  color: vars.color.accent,
});

export const mobileBoardStrip = style({
  display: 'none',
  '@media': {
    'screen and (max-width: 900px)': {
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      padding: '0 0 12px',
      marginBottom: '8px',
      scrollbarWidth: 'none',
    },
  },
});

export const mobileBoardChip = style({
  ...subtleButton,
  flex: '0 0 auto',
  minHeight: '34px',
  padding: '0 12px',
  borderRadius: '999px',
  border: vars.border.subtle,
  background: vars.color.surface,
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.04em',
});

export const mobileBoardChipActive = style({
  color: vars.color.text,
  background: vars.color.accentWash,
  borderColor: vars.color.borderAccent,
});

export const mainColumn = style({
  minWidth: 0,
});

export const feedHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'end',
  gap: '16px',
  padding: '4px 0 16px',
  borderBottom: vars.border.subtle,
  marginBottom: '12px',
  '@media': {
    'screen and (max-width: 640px)': {
      alignItems: 'start',
      flexDirection: 'column',
    },
  },
});

globalStyle(`${feedHeader} h1`, {
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '42px',
  lineHeight: 1,
  fontWeight: 600,
  letterSpacing: '0',
});

globalStyle(`${feedHeader} p`, {
  margin: '6px 0 0',
  fontSize: '13px',
  lineHeight: 1.5,
  color: vars.color.textMuted,
});

globalStyle(`${feedHeader} h1`, {
  '@media': {
    'screen and (max-width: 640px)': {
      fontSize: '34px',
    },
  },
});

export const kicker = style({
  margin: '0 0 6px !important',
  fontFamily: vars.font.label,
  fontSize: '10px !important',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: `${vars.color.accent} !important`,
});

export const feedHeaderMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
});

globalStyle(`${feedHeaderMeta} span`, {
  minHeight: '30px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '0 10px',
  borderRadius: '999px',
  border: vars.border.subtle,
  background: vars.color.surface,
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
});

export const avatar = style({
  width: '38px',
  height: '38px',
  borderRadius: '0px',
  objectFit: 'cover',
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: vars.border.subtle,
  background: vars.color.surfaceSoft,
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '12px',
  overflow: 'hidden',
});

export const avatarLarge = style({
  width: '52px',
  height: '52px',
  fontSize: '16px',
});

export const avatarAnon = style({
  background: vars.color.accentWash,
  borderColor: vars.color.borderAccent,
  color: vars.color.accent,
});

export const composerCollapsed = style({
  ...subtleButton,
  width: '100%',
  minHeight: '62px',
  display: 'grid',
  gridTemplateColumns: '38px minmax(0, 1fr) 22px',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  borderRadius: '0px',
  border: vars.border.subtle,
  background: vars.color.surface,
  color: vars.color.textFaint,
  textAlign: 'left',
  marginBottom: '12px',
  selectors: {
    '&:hover': {
      background: vars.color.surfaceRaised,
      borderColor: vars.color.borderStrong,
      color: vars.color.textMuted,
    },
  },
});

export const composer = style({
  padding: '12px',
  borderRadius: '0px',
  border: vars.border.subtle,
  background: vars.color.surface,
  marginBottom: '12px',
});

export const composerTop = style({
  display: 'grid',
  gridTemplateColumns: '38px minmax(0, 1fr)',
  gap: '12px',
});

export const composerFields = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const composerTitleInput = style({
  width: '100%',
  minHeight: '38px',
  border: 0,
  outline: 'none',
  background: 'transparent',
  color: vars.color.text,
  fontSize: '18px',
  fontWeight: 600,
  selectors: {
    '&::placeholder': {
      color: vars.color.textFaint,
    },
  },
});

export const composerTextarea = style({
  width: '100%',
  minHeight: '108px',
  resize: 'vertical',
  border: 0,
  outline: 'none',
  background: 'transparent',
  color: vars.color.textSoft,
  fontSize: '14px',
  lineHeight: 1.6,
  selectors: {
    '&::placeholder': {
      color: vars.color.textFaint,
    },
  },
});

export const honeypot = style({
  position: 'absolute',
  left: '-9999px',
  opacity: 0,
  height: 0,
  overflow: 'hidden',
});

export const composerMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  padding: '12px 0',
  marginTop: '8px',
  borderTop: vars.border.subtle,
});

export const selectWrap = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

globalStyle(`${selectWrap} select`, {
  minHeight: '32px',
  borderRadius: '0px',
  border: vars.border.subtle,
  background: vars.color.surfaceSoft,
  color: vars.color.text,
  padding: '0 10px',
  outline: 'none',
});

export const identityToggle = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  minHeight: '32px',
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
});

globalStyle(`${identityToggle} input`, {
  accentColor: vars.color.accent,
});

export const anonInput = style({
  minHeight: '32px',
  minWidth: '150px',
  borderRadius: '0px',
  border: vars.border.subtle,
  background: vars.color.surfaceSoft,
  color: vars.color.text,
  padding: '0 10px',
  outline: 'none',
  fontSize: '12px',
});

export const formError = style({
  color: vars.color.accent,
  fontSize: '12px',
  margin: '4px 0 10px',
});

export const composerActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  flexWrap: 'wrap',
});

export const composerActionButtons = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

export const feedTabs = style({
  position: 'sticky',
  top: 0,
  zIndex: 5,
  display: 'flex',
  gap: '6px',
  padding: '8px 0',
  marginBottom: '6px',
  background: vars.color.background,
  borderBottom: vars.border.subtle,
});

export const feedTab = style({
  ...subtleButton,
  minHeight: '34px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  padding: '0 12px',
  borderRadius: '999px',
  border: vars.border.subtle,
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  selectors: {
    '&:hover': {
      color: vars.color.text,
      background: vars.color.surfaceSoft,
    },
  },
});

export const feedTabActive = style({
  color: vars.color.text,
  background: vars.color.accentWash,
  borderColor: vars.color.borderAccent,
});

export const feedList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const feedCard = style({
  display: 'grid',
  gridTemplateColumns: '38px minmax(0, 1fr)',
  gap: '12px',
  padding: '12px',
  borderRadius: '0px',
  border: vars.border.subtle,
  background: vars.color.surface,
  transition: 'border-color 160ms ease, background 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: vars.color.borderStrong,
      background: vars.color.surfaceRaised,
    },
  },
});

export const feedCardAvatar = style({
  paddingTop: '2px',
});

export const feedCardBody = style({
  minWidth: 0,
});

export const feedCardHeader = style({
  display: 'flex',
  alignItems: 'start',
  justifyContent: 'space-between',
  gap: '10px',
  marginBottom: '6px',
});

export const identityLine = style({
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flexWrap: 'wrap',
  color: vars.color.textFaint,
  fontSize: '12px',
});

export const displayName = style({
  maxWidth: '220px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.color.text,
  fontWeight: 650,
});

export const handle = style({
  maxWidth: '160px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.color.textFaint,
});

export const dot = style({
  color: vars.color.textFaint,
});

export const boardBadge = style({
  ...subtleButton,
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '24px',
  padding: '0 8px',
  borderRadius: '999px',
  border: vars.border.subtle,
  background: vars.color.surfaceSoft,
  color: vars.color.accent,
  fontFamily: vars.font.label,
  fontSize: '11px',
});

export const stateBadges = style({
  display: 'flex',
  gap: '6px',
  flexShrink: 0,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
});

export const stateBadge = style({
  minHeight: '22px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '0 7px',
  borderRadius: '999px',
  border: vars.border.subtle,
  color: vars.color.warning,
  fontFamily: vars.font.label,
  fontSize: '10px',
  textTransform: 'uppercase',
});

export const feedTitleButton = style({
  ...subtleButton,
  display: 'block',
  width: '100%',
  margin: '0 0 7px',
  color: vars.color.text,
  textAlign: 'left',
  fontSize: '18px',
  lineHeight: 1.25,
  fontWeight: 650,
  overflowWrap: 'anywhere',
  selectors: {
    '&:hover': {
      color: vars.color.accentHover,
    },
  },
});

export const feedExcerpt = style({
  color: vars.color.textSoft,
  fontSize: '14px',
  lineHeight: 1.55,
  overflowWrap: 'anywhere',
});

export const greentext = style({
  color: '#2d8a4e',
});

export const quoteLink = style({
  color: vars.color.accent,
  fontFamily: vars.font.label,
});

export const previewFade = style({
  marginTop: '4px',
  color: vars.color.textFaint,
});

export const feedActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  marginTop: '12px',
});

export const feedAction = style({
  ...subtleButton,
  minWidth: '44px',
  minHeight: '30px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '0 8px',
  borderRadius: '999px',
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '11px',
  selectors: {
    '&:hover': {
      color: vars.color.text,
      background: vars.color.surfaceSoft,
    },
  },
});

export const feedActionActive = style({
  color: vars.color.accent,
  background: vars.color.accentWash,
});

export const rightRail = style({
  position: 'sticky',
  top: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  minWidth: 0,
  '@media': {
    'screen and (max-width: 1180px)': {
      display: 'none',
    },
  },
});

export const sidePanel = style({
  padding: '12px',
  borderRadius: '0px',
  border: vars.border.subtle,
  background: vars.color.surface,
});

export const sidePanelHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '10px',
  color: vars.color.text,
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

export const statGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
});

globalStyle(`${statGrid} div`, {
  minHeight: '58px',
  padding: '10px',
  borderRadius: '0px',
  background: vars.color.surfaceSoft,
  border: vars.border.subtle,
});

globalStyle(`${statGrid} strong`, {
  display: 'block',
  color: vars.color.text,
  fontSize: '20px',
  lineHeight: 1,
});

globalStyle(`${statGrid} span`, {
  display: 'block',
  marginTop: '6px',
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '10px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
});

export const trendingList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const trendingItem = style({
  ...subtleButton,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  padding: '9px',
  borderRadius: '0px',
  color: vars.color.textFaint,
  textAlign: 'left',
  selectors: {
    '&:hover': {
      background: vars.color.surfaceSoft,
    },
  },
});

export const trendingTitle = style({
  color: vars.color.textSoft,
  fontSize: '13px',
  lineHeight: 1.35,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
});

export const mutedText = style({
  margin: 0,
  color: vars.color.textFaint,
  fontSize: '13px',
});

export const paginationRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  padding: '18px 0 0',
});

export const backButton = style({
  ...subtleButton,
  minHeight: '34px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '12px',
  color: vars.color.textMuted,
  fontFamily: vars.font.label,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  selectors: {
    '&:hover': {
      color: vars.color.text,
    },
  },
});

export const threadDetailPost = style({
  padding: '14px',
  borderRadius: '0px',
  border: vars.border.subtle,
  background: vars.color.surface,
});

export const threadDetailTop = style({
  display: 'grid',
  gridTemplateColumns: '52px minmax(0, 1fr)',
  gap: '12px',
  alignItems: 'start',
});

export const threadDetailMeta = style({
  minWidth: 0,
});

globalStyle(`${threadDetailMeta} h1`, {
  margin: '6px 0 0',
  color: vars.color.text,
  fontSize: '26px',
  lineHeight: 1.16,
  overflowWrap: 'anywhere',
  '@media': {
    'screen and (max-width: 640px)': {
      fontSize: '22px',
    },
  },
});

export const threadDetailContent = style({
  marginTop: '18px',
  paddingTop: '16px',
  borderTop: vars.border.subtle,
  color: vars.color.textSoft,
  fontSize: '15px',
  lineHeight: 1.72,
  overflowWrap: 'anywhere',
});

export const threadDetailActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  marginTop: '16px',
  paddingTop: '12px',
  borderTop: vars.border.subtle,
});

export const replyComposer = style({
  display: 'grid',
  gridTemplateColumns: '38px minmax(0, 1fr)',
  gap: '12px',
  marginTop: '12px',
  padding: '12px',
  borderRadius: '0px',
  border: vars.border.subtle,
  background: vars.color.surface,
});

export const replyComposerBody = style({
  minWidth: 0,
});

export const replyTextarea = style({
  width: '100%',
  minHeight: '92px',
  resize: 'vertical',
  border: 0,
  outline: 'none',
  background: 'transparent',
  color: vars.color.textSoft,
  fontSize: '14px',
  lineHeight: 1.6,
});

export const replyComposerMeta = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  flexWrap: 'wrap',
  paddingTop: '10px',
  borderTop: vars.border.subtle,
});

export const lockedNotice = style({
  minHeight: '44px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '12px',
  padding: '0 12px',
  borderRadius: '0px',
  border: vars.border.subtle,
  background: vars.color.surface,
  color: vars.color.textMuted,
  fontSize: '13px',
});

export const commentsSection = style({
  marginTop: '18px',
});

export const commentsHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '10px',
});

globalStyle(`${commentsHeader} h2`, {
  margin: 0,
  color: vars.color.text,
  fontFamily: vars.font.display,
  fontSize: '28px',
  lineHeight: 1,
});

globalStyle(`${commentsHeader} span`, {
  color: vars.color.textFaint,
  fontFamily: vars.font.label,
  fontSize: '12px',
});

export const commentsList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const commentCard = style({
  display: 'grid',
  gridTemplateColumns: '38px minmax(0, 1fr)',
  gap: '12px',
  padding: '12px',
  borderRadius: '0px',
  border: vars.border.subtle,
  background: vars.color.surface,
});

export const commentCardNested = style({
  marginLeft: '30px',
  boxShadow: `inset 2px 0 0 ${vars.color.borderAccent}`,
  '@media': {
    'screen and (max-width: 640px)': {
      marginLeft: '12px',
    },
  },
});

export const commentBodyWrap = style({
  minWidth: 0,
});

export const commentHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flexWrap: 'wrap',
  color: vars.color.textFaint,
  fontSize: '12px',
});

export const commentText = style({
  marginTop: '6px',
  color: vars.color.textSoft,
  fontSize: '14px',
  lineHeight: 1.6,
  overflowWrap: 'anywhere',
});

export const bottomNav = style({
  display: 'none',
  '@media': {
    'screen and (max-width: 760px)': {
      position: 'fixed',
      left: '10px',
      right: '10px',
      bottom: '10px',
      zIndex: 20,
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '4px',
      padding: '6px',
      borderRadius: '0px',
      border: vars.border.subtle,
      background: 'rgba(9,9,9,0.94)',
      backdropFilter: 'blur(14px)',
      boxShadow: vars.shadow.panel,
    },
  },
});

globalStyle(`${bottomNav} button, ${bottomNav} a`, {
  ...subtleButton,
  minHeight: '44px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3px',
  borderRadius: '0px',
  color: vars.color.textMuted,
  fontSize: '10px',
});

globalStyle(`${bottomNav} button:hover, ${bottomNav} a:hover`, {
  background: vars.color.surfaceSoft,
  color: vars.color.text,
});
