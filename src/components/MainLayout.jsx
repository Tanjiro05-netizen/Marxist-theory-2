// src/components/MainLayout.jsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import Header from './Header';
import * as s from './MainLayout.css.ts';
import { studyThemeClass } from '../styles/obsidianTheme.css.ts';

const MainLayout = ({ children, hideHeader = false, hideFab = false }) => {
    const pathname = usePathname();
    const isMarxBotPage = pathname === '/marxbot';

    return (
        <div className={`${studyThemeClass} ${s.shell}`}>
            {!hideHeader && <Header />}
            <main className={hideHeader ? s.mainFullBleed : s.main}>
                {children}
            </main>

            {/* Floating MarxBot button — hidden on /marxbot page itself */}
            {!hideFab && !isMarxBotPage && (
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
