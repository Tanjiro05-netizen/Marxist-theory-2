import React, { createContext, useContext, useEffect } from 'react';

/* Fonts are self-hosted via next/font in app/layout.jsx (variables on <html>,
   consumed as --ff-* in theme.css). This provider only carries the theme and
   sets the document-level theme attributes. */

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const theme = 'dark';

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
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
