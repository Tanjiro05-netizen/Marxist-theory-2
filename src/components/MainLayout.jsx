// src/components/MainLayout.jsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import * as s from './MainLayout.css.ts';
import { themeDefaults } from '../styles/obsidianTheme.css.ts';

const MainLayout = ({ children, hideHeader = false, hideFab = false }) => {
    const pathname = usePathname();
    // Routes that render their own full-height surface (chat / social feed)
    const hideFabForRoute = pathname === '/marxbot' || pathname === '/feed/social';
    // Reading surfaces keep the page to themselves: the band scrolls away and
    // the reader's own toolbar is the only sticky chrome.
    const readerRoute = Boolean(
        pathname && (pathname.startsWith('/book') || pathname.startsWith('/science-tech/textbooks'))
    );

    return (
        <div className={`${themeDefaults} ${s.shell}`}>
            {!hideHeader && <Header bandStatic={readerRoute} />}
            <main className={hideHeader ? s.mainFullBleed : s.main}>
                {children}
            </main>

            <Footer />

            {/* Floating MarxBot button — hidden on routes with their own full-height surface */}
            {!hideFab && !hideFabForRoute && (
                <Link href="/marxbot" className={s.fab} title="MarxBot — Public Preview">
                    <div className={s.fabCircle}>
                        <Bot size={18} />
                        <div className={s.fabPulse} />
                    </div>
                    <div className={s.fabTooltip}>
                        MarxBot<span className={s.fabAccent}>TM</span> Preview
                    </div>
                </Link>
            )}
        </div>
    );
};

export default MainLayout;
