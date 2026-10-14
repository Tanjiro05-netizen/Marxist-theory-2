import React, { createContext, useContext, useEffect, useState } from 'react';

/* Fonts are self-hosted via next/font in app/layout.jsx (variables on <html>,
   consumed as --ff-* in theme.css). The theme itself is the data-theme
   attribute on <html>, set before first paint by the inline script there and
   flipped by ThemeToggle. This provider mirrors that attribute into React so
   components can read or set it; it never overrides it. */

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState('dark');

    useEffect(() => {
        const el = document.documentElement;
        const sync = () => setThemeState(el.dataset.theme === 'light' ? 'light' : 'dark');
        sync();
        const observer = new MutationObserver(sync);
        observer.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    const setTheme = (next) => {
        document.documentElement.dataset.theme = next === 'light' ? 'light' : 'dark';
        try { localStorage.setItem('theme', next === 'light' ? 'light' : 'dark'); } catch { /* private mode */ }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook to use the theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
