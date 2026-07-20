import { style } from '@vanilla-extract/css';
import { panelBase, panelInset, vars } from '../components/StudyPage/studyTheme.css.ts';

export const page = style({
  position: 'relative',
  minHeight: '100vh',
  overflow: 'hidden',
});

export const heroOrbLeft = style({
  top: '80px',
  left: '-120px',
  width: '320px',
  height: '320px',
  background: 'radial-gradient(circle, rgba(200,30,30,0.22) 0%, rgba(200,30,30,0.02) 70%)',
});

export const heroOrbRight = style({
  top: '180px',
  right: '-120px',
  width: '280px',
  height: '280px',
  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 72%)',
});

export const lowerOrb = style({
  bottom: '120px',
  left: '45%',
  width: '300px',
  height: '300px',
  background: 'radial-gradient(circle, rgba(200,30,30,0.12) 0%, rgba(200,30,30,0.02) 70%)',
});

export const hero = style({
  position: 'relative',
  padding: `${vars.space.hero} ${vars.space.gutter} ${vars.space.xxl}`,
  borderBottom: vars.border.subtle,
  '@media': {
    'screen and (max-width: 900px)': {
      padding: `${vars.space.xxxl} ${vars.space.gutter} ${vars.space.xxl}`,
    },
    'screen and (max-width: 640px)': {
      padding: `${vars.space.xxl} ${vars.space.md} ${vars.space.xl}`,
    },
  },
});

export const heroBackdrop = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
});

export const heroImage = style({
  position: 'absolute',
  inset: '-6%',
  width: '112%',
  height: '112%',
  objectFit: 'cover',
  opacity: 0.18,
  filter: 'grayscale(0.35) brightness(0.62) contrast(1.08)',
  mixBlendMode: 'screen',
});

export const heroScrim = style({
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(9,9,9,0.8) 0%, rgba(9,9,9,0.58) 30%, rgba(9,9,9,0.92) 100%)',
});

export const heroNoise = style({
  position: 'absolute',
  inset: 0,
  backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.05) 0, transparent 22%), radial-gradient(circle at 80% 10%, rgba(200,30,30,0.08) 0, transparent 18%), radial-gradient(circle at 30% 70%, rgba(255,255,255,0.03) 0, transparent 25%)',
  opacity: 0.5,
});

export const heroInner = style({
  position: 'relative',
  zIndex: 1,
  maxWidth: vars.layout.maxWidth,
  margin: '0 auto',
});

export const heroGrid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 0.9fr)',
  gap: vars.space.xxxl,
  alignItems: 'stretch',
  '@media': {
    'screen and (max-width: 1060px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const heroContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
  minWidth: 0,
});

export const heroBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  alignSelf: 'flex-start',
  minHeight: '32px',
  padding: `0 ${vars.space.md}`,
  borderRadius: vars.radius.pill,
  border: vars.border.accent,
  background: 'rgba(15,15,15,0.75)',
  boxShadow: vars.shadow.glow,
  color: vars.color.textSoft,
  fontFamily: vars.font.mono,
  fontSize: '10px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

export const heroCopy = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
});

export const heroTitle = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: 'clamp(3.8rem, 8vw, 6.8rem)',
  lineHeight: 0.9,
  letterSpacing: '-0.05em',
  fontWeight: 500,
  color: vars.color.text,
  textWrap: 'balance',
});

export const heroQuote = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: 'clamp(1.4rem, 2vw, 2rem)',
  lineHeight: 1.2,
  color: 'rgba(255,255,255,0.86)',
  maxWidth: '900px',
});

export const heroLead = style({
  margin: 0,
  maxWidth: '760px',
  fontSize: '15px',
  lineHeight: 1.85,
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const searchShell = style([panelInset, {
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: vars.space.sm,
  boxShadow: vars.shadow.soft,
  '@media': {
    'screen and (max-width: 720px)': {
      flexWrap: 'wrap',
      alignItems: 'stretch',
    },
  },
}]);

export const searchIcon = style({
  color: vars.color.textFaint,
  flexShrink: 0,
  marginLeft: vars.space.sm,
});

export const searchInput = style({
  flex: 1,
  minWidth: 0,
  minHeight: '48px',
  background: 'transparent',
  border: 'none',
  color: vars.color.text,
  fontSize: '15px',
  fontWeight: 300,
  outline: 'none',
});

export const heroMetaRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
});

export const heroStatGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: vars.space.md,
  '@media': {
    'screen and (max-width: 900px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    'screen and (max-width: 520px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const statCard = style([panelInset, {
  padding: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minHeight: '122px',
}]);

export const statLabel = style({
  margin: 0,
  fontFamily: vars.font.mono,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: vars.color.textFaint,
});

export const statValue = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '34px',
  lineHeight: 0.95,
  color: vars.color.text,
});

export const statNote = style({
  margin: 0,
  fontSize: '12px',
  lineHeight: 1.6,
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const heroAside = style({
  minWidth: 0,
});

export const featurePanel = style([panelBase, {
  padding: vars.space.xxl,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
}]);

export const featureHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: vars.space.md,
});

export const featureTitle = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '34px',
  lineHeight: 0.98,
  fontWeight: 500,
  letterSpacing: '-0.03em',
  color: vars.color.text,
});

export const featureCopy = style({
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.8,
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const featureActionRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
});

export const featureList = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: vars.space.md,
});

export const featureListItem = style([panelInset, {
  padding: vars.space.md,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
}]);

export const featureItemLabel = style({
  margin: 0,
  fontFamily: vars.font.mono,
  fontSize: '10px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const featureItemValue = style({
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.65,
  color: vars.color.textSoft,
  fontWeight: 300,
});

export const commandBar = style({
  position: 'sticky',
  top: '64px',
  zIndex: 30,
  padding: `0 ${vars.space.gutter}`,
  '@media': {
    'screen and (max-width: 640px)': {
      padding: `0 ${vars.space.md}`,
      top: '58px',
    },
  },
});

export const commandBarInner = style([panelInset, {
  maxWidth: vars.layout.maxWidth,
  margin: `-${vars.space.lg} auto 0`,
  padding: vars.space.sm,
  display: 'flex',
  justifyContent: 'space-between',
  gap: vars.space.md,
  alignItems: 'center',
  backdropFilter: 'blur(14px)',
  background: 'rgba(20,20,20,0.92)',
  '@media': {
    'screen and (max-width: 980px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
}]);

export const commandFilters = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
});

export const commandActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
  justifyContent: 'flex-end',
  '@media': {
    'screen and (max-width: 980px)': {
      justifyContent: 'flex-start',
    },
  },
});

export const layout = style({
  position: 'relative',
  zIndex: 1,
  maxWidth: vars.layout.maxWidth,
  margin: '0 auto',
  padding: `${vars.space.xxxl} ${vars.space.gutter} ${vars.space.xxxl}`,
  '@media': {
    'screen and (max-width: 640px)': {
      padding: `${vars.space.xxl} ${vars.space.md} ${vars.space.xxxl}`,
    },
  },
});

export const editorialGrid = style({
  display: 'grid',
  gridTemplateColumns: `minmax(300px, ${vars.layout.rail}) minmax(0, 1fr)`,
  gap: vars.space.xl,
  alignItems: 'start',
  '@media': {
    'screen and (max-width: 1120px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const rail = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
  minWidth: 0,
});

export const main = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
  minWidth: 0,
});

export const sidePanel = style([panelBase, {
  padding: vars.space.xl,
}]);

export const mainPanel = style([panelBase, {
  padding: vars.space.xxl,
  '@media': {
    'screen and (max-width: 640px)': {
      padding: vars.space.xl,
    },
  },
}]);

export const audioTeaserPanel = style([panelBase, {
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
}]);

export const teaserList = style({
  display: 'grid',
  gap: vars.space.sm,
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
});

export const teaserItem = style([panelInset, {
  padding: vars.space.sm,
  display: 'grid',
  gridTemplateColumns: '46px minmax(0, 1fr)',
  gap: vars.space.sm,
  alignItems: 'center',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  color: 'inherit',
  width: '100%',
  transition: 'border-color 180ms ease, transform 180ms ease, background 180ms ease',
  selectors: {
    '&:hover': {
      transform: 'translateX(3px)',
      borderColor: vars.color.borderAccent,
      background: vars.color.accentWash,
    },
  },
}]);

export const teaserCover = style({
  width: '46px',
  height: '46px',
  borderRadius: vars.radius.md,
  objectFit: 'cover',
  border: vars.border.subtle,
  background: vars.color.surface,
});

export const teaserCoverFallback = style({
  width: '46px',
  height: '46px',
  borderRadius: vars.radius.md,
  border: vars.border.subtle,
  background: vars.color.surfaceSoft,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.accent,
});

export const teaserText = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xxs,
});

export const teaserTitle = style({
  margin: 0,
  fontSize: '13px',
  fontWeight: 400,
  color: vars.color.text,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const teaserMeta = style({
  margin: 0,
  fontSize: '12px',
  fontWeight: 300,
  color: vars.color.textMuted,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const lecturesGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: vars.space.lg,
  '@media': {
    'screen and (max-width: 1020px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    'screen and (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const lectureCard = style([panelInset, {
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.sm,
  transition: 'transform 180ms ease, border-color 180ms ease, background 180ms ease',
  selectors: {
    '&:hover': {
      transform: 'translateY(-3px)',
      borderColor: vars.color.borderAccent,
      background: vars.color.surfaceRaised,
    },
  },
}]);

export const lectureVisual = style({
  position: 'relative',
  aspectRatio: '16 / 10',
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(200,30,30,0.08) 100%)',
  border: vars.border.subtle,
});

export const lectureImage = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  opacity: 0.88,
});

export const lectureOverlay = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(180deg, rgba(9,9,9,0.12) 0%, rgba(9,9,9,0.48) 100%)',
});

export const lecturePlay = style({
  width: '54px',
  height: '54px',
  borderRadius: '50%',
  background: 'rgba(9,9,9,0.72)',
  border: vars.border.accent,
  color: vars.color.text,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: vars.shadow.glow,
});

export const lectureBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minWidth: 0,
  padding: `0 ${vars.space.sm} ${vars.space.sm}`,
});

export const lectureTitle = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontSize: '26px',
  lineHeight: 1,
  color: vars.color.text,
});

export const lectureMeta = style({
  margin: 0,
  fontSize: '12px',
  fontWeight: 300,
  lineHeight: 1.7,
  color: vars.color.textMuted,
});

export const playerPanel = style([panelBase, {
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  borderColor: vars.color.borderAccent,
}]);

export const playerHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
});

export const playerCover = style({
  width: '64px',
  height: '64px',
  borderRadius: vars.radius.md,
  objectFit: 'cover',
  border: vars.border.subtle,
  background: vars.color.surface,
  flexShrink: 0,
});

export const playerCoverFallback = style({
  width: '64px',
  height: '64px',
  borderRadius: vars.radius.md,
  border: vars.border.subtle,
  background: vars.color.surfaceSoft,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.accent,
  flexShrink: 0,
});

export const playerInfo = style({
  minWidth: 0,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xxs,
});

export const playerTitle = style({
  margin: 0,
  fontSize: '16px',
  fontFamily: vars.font.display,
  fontWeight: 400,
  color: vars.color.text,
});

export const playerAuthor = style({
  margin: 0,
  fontSize: '12px',
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const playerClose = style({
  flexShrink: 0,
  width: '32px',
  height: '32px',
  borderRadius: vars.radius.md,
  border: vars.border.subtle,
  background: vars.color.surfaceSoft,
  color: vars.color.textMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'border-color 150ms ease, color 150ms ease',
  selectors: {
    '&:hover': {
      borderColor: vars.color.borderAccent,
      color: vars.color.text,
    },
  },
});

export const playerAudio = style({
  width: '100%',
  height: '40px',
  borderRadius: vars.radius.md,
  outline: 'none',
});

export const playerChapters = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xxs,
});

export const playerChaptersLabel = style({
  margin: 0,
  fontFamily: vars.font.mono,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: vars.color.textFaint,
  marginBottom: vars.space.xxs,
});

export const playerChapterBtn = style({
  all: 'unset',
  cursor: 'pointer',
  padding: `${vars.space.xs} ${vars.space.sm}`,
  fontSize: '12px',
  fontWeight: 300,
  color: vars.color.textMuted,
  borderRadius: vars.radius.md,
  transition: 'background 150ms ease, color 150ms ease',
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  selectors: {
    '&:hover': {
      background: vars.color.accentWash,
      color: vars.color.text,
    },
  },
});

export const teaserItemActive = style({
  borderColor: vars.color.borderAccent,
  background: vars.color.accentWash,
});
