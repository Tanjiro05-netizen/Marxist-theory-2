import React, { useEffect, useState } from 'react';
import * as pill from './ThemeToggle.css.ts';

/* Light/dark pill switch — same control as the experimental reader: a sliding
   knob with a sun/moon crossfade, no text. The theme itself lives on
   <html data-theme="…"> — set before first paint by the script in
   app/layout.jsx, so this component only reads the current state, flips it,
   and lets the CSS selectors in ThemeToggle.css.ts drive the visuals. */

const SunIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="3.7" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M10 1.5v2.4M10 16.1v2.4M1.5 10h2.4M16.1 10h2.4M4 4l1.7 1.7M14.3 14.3l1.7 1.7M16 4l-1.7 1.7M5.7 14.3L4 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
);

const MoonIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10.2 2.6a7.4 7.4 0 0 0 7.2 7.2A7.4 7.4 0 1 1 10.2 2.6Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
);

const ThemeToggle = ({ className = '' }) => {
    const [light, setLight] = useState(null);

    useEffect(() => {
        setLight(document.documentElement.dataset.theme === 'light');
    }, []);

    const toggle = () => {
        const next = light ? 'dark' : 'light';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch { /* private mode */ }
        setLight(next === 'light');
    };

    const label = light ? 'Switch to dark mode' : 'Switch to light mode';

    return (
        <button
            type="button"
            className={`${pill.switchBtn}${className ? ` ${className}` : ''}`}
            onClick={toggle}
            role="switch"
            aria-checked={light === true ? 'false' : 'true'}
            aria-label={label}
            title={label}
        >
            <span className={pill.track} aria-hidden="true">
                <SunIcon className={pill.targetSun} />
                <MoonIcon className={pill.targetMoon} />
                <span className={pill.knob}>
                    <SunIcon className={pill.knobSun} />
                    <MoonIcon className={pill.knobMoon} />
                </span>
            </span>
        </button>
    );
};

export default ThemeToggle;
