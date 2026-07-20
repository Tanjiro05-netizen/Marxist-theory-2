import React, { createContext, useContext, useEffect } from 'react';

const FONT_LINK_ID = 'marxist-google-fonts';
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Hanken+Grotesk:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';

const ThemeContext = createContext();

const ensureFontLink = () => {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById(FONT_LINK_ID);
    if (!existing) {
        const link = document.createElement('link');
        link.id = FONT_LINK_ID;
        link.rel = 'stylesheet';
        link.href = FONT_HREF;
        document.head.appendChild(link);
    }
};

export const ThemeProvider = ({ children }) => {
    const theme = 'dark';

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        ensureFontLink();
    }, []);

    return (
        <ThemeContext.Provider value={{ theme }}>
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
