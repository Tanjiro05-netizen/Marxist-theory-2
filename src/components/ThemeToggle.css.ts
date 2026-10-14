import { style } from '@vanilla-extract/css';

/* The light/dark pill switch — a sliding knob with a sun/moon crossfade and
   the opposite mode's icon ghosted at the far end. Colors track the page
   theme through the global --text and --line vars, so the pill fits both the
   ink band (dark) and the paper band (light). The knob rests at the right
   (dark) position because dark is the site's default, mirroring the
   experimental reader's switch. */

const SLIDE = 'transform 550ms cubic-bezier(0.3, 1.4, 0.35, 1)';
const FADE = 'opacity 300ms ease';

export const switchBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: 0,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
});

export const track = style({
  position: 'relative',
  display: 'block',
  width: '44px',
  height: '24px',
  borderRadius: '999px',
  border: '1px solid var(--line)',
  background: 'var(--line-soft)',
  transition: 'background-color 300ms ease, border-color 300ms ease',
});

export const knob = style({
  position: 'absolute',
  top: '50%',
  left: '3px',
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  background: 'var(--text-primary)',
  color: 'var(--ink)',
  display: 'grid',
  placeItems: 'center',
  transform: 'translateY(-50%)',
  boxShadow: '0 1px 3px rgba(11, 13, 18, 0.25)',
  transition: `${SLIDE}, background-color 300ms ease`,
  selectors: {
    'html:not([data-theme="light"]) &': {
      transform: 'translateY(-50%) translateX(20px)',
    },
    [`${switchBtn}:hover &`]: {
      boxShadow: '0 1px 5px rgba(11, 13, 18, 0.35)',
    },
    [`${switchBtn}:active &`]: {
      transform: 'translateY(-50%) scale(0.92)',
    },
    [`html:not([data-theme="light"]) ${switchBtn}:active &`]: {
      transform: 'translateY(-50%) translateX(20px) scale(0.92)',
    },
  },
});

export const knobIcon = style({
  gridArea: '1 / 1',
  display: 'block',
  width: '11px',
  height: '11px',
  transition: `${FADE}, ${SLIDE}`,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
});

export const knobSun = style([knobIcon, {
  selectors: {
    'html:not([data-theme="light"]) &': {
      opacity: 0,
      transform: 'rotate(120deg) scale(0.3)',
    },
  },
}]);

export const knobMoon = style([knobIcon, {
  opacity: 0,
  transform: 'rotate(-120deg) scale(0.3)',
  selectors: {
    'html:not([data-theme="light"]) &': {
      opacity: 1,
      transform: 'none',
    },
  },
}]);

export const targetIcon = style({
  position: 'absolute',
  top: '50%',
  display: 'block',
  width: '10px',
  height: '10px',
  marginTop: '-5px',
  color: 'var(--text-tertiary)',
  transition: 'opacity 300ms ease 120ms, transform 400ms ease',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
});

export const targetSun = style([targetIcon, {
  left: '7px',
  opacity: 0,
  transform: 'scale(0.5) rotate(-45deg)',
  selectors: {
    'html:not([data-theme="light"]) &': {
      opacity: 1,
      transform: 'none',
      transitionDelay: '0ms',
    },
  },
}]);

export const targetMoon = style([targetIcon, {
  right: '7px',
  selectors: {
    'html:not([data-theme="light"]) &': {
      opacity: 0,
      transform: 'scale(0.5) rotate(45deg)',
    },
  },
}]);
