import React, { useState, useEffect } from 'react';
import { Menu, LogOut, BarChart, BookOpen, FileText, Home, BookMarked, LineChart, Users, Shield, HelpCircle, ChevronDown, Newspaper, Radio, Search, Sun } from 'lucide-react';
import Link from 'next/link';
import { prefetchRouteData, prefetchAllRoutesWhenIdle } from '../lib/routePrefetch';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import * as s from './Header.css.ts';

const Header = () => {
    const { user, logout, isAdmin, canManagePolitics } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isAdminUser = isAdmin();
    const canEditPolitics = canManagePolitics();

    // After first paint, warm every route's data during idle time so any
    // navigation lands on a hot cache.
    useEffect(() => {
        prefetchAllRoutesWhenIdle();
    }, []);

    const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };
    
    // All nav items - some are guest-accessible, others require login
    const allNavItems = [
        { path: '/home', label: t('nav.home'), icon: Home, guestAccessible: true },
        {
            label: t('nav.theory'),
            icon: BookMarked,
            guestAccessible: false,
            featureKey: 'theory',
            children: [
                { path: '/theory', label: t('nav.theoryRead'), description: t('nav.theoryReadDesc') },
                { path: '/analysis', label: t('nav.theoryAnalyze'), description: t('nav.theoryAnalyzeDesc') },
            ],
        },
        { path: '/digital-library', label: t('nav.library'), icon: BookOpen, guestAccessible: true },
        { path: '/study', label: t('nav.study'), icon: BarChart, guestAccessible: false, featureKey: 'study' },
        { path: '/science-tech', label: t('nav.scienceTech'), icon: FileText, guestAccessible: false, featureKey: 'science-tech' },
        { path: '/politics', label: t('nav.politics'), icon: FileText, guestAccessible: false, featureKey: 'politics' },
        { path: '/substack', label: t('nav.substack'), icon: Newspaper, guestAccessible: true },
        { path: '/visualizations', label: t('nav.data'), icon: LineChart, guestAccessible: false, featureKey: 'visualizations' },
        { path: '/directory', label: t('nav.directory'), icon: Users, guestAccessible: false, featureKey: 'directory' },
        { path: '/feed', label: t('nav.feed'), icon: Radio, guestAccessible: true, featureKey: 'feed' },
        { path: '/knowledge', label: t('nav.knowledgeQA'), icon: HelpCircle, guestAccessible: false, featureKey: 'knowledge' }
    ];
    
    // Show all nav items to everyone; guests see member-only gates for restricted ones.
    const navItems = allNavItems;
    
    return (
        /* Fragment on purpose: the navband must be a direct child of the page
           shell (min-height 100vh) for position:sticky to hold for the whole
           document — wrapping it in a <header> confines the stick to that
           short box and the band scrolls away. */
        <>
            {/* Masthead — centered, scrolls away */}
            <div className={s.masthead}>
                <Link href="/home" className={s.mastheadLink}>
                    <span className={s.mastheadWord}>
                        Marxists<span className={s.mastheadDot}>.</span>Info
                    </span>
                    <span className={s.mastheadRule} aria-hidden="true" />
                </Link>
            </div>

            {/* Paper navband — sticky */}
            <div className={s.navband}>
                <div className={s.navbandInner}>
                    <div className={s.bandSlot}>
                        <Link href="/digital-library" className={s.bandIconLink} title={t('nav.searchLibrary')}>
                            <Search size={15} strokeWidth={1.8} />
                        </Link>
                        <LanguageSwitcher />
                    </div>

                    {/* Desktop Navigation */}
                    <div className={s.desktopNav}>
                        <nav className={s.navRow}>
                            {navItems.map((item) => {
                                const isRestricted = !user && !item.guestAccessible;

                                if (item.children) {
                                    const anyChildActive = item.children.some(c => isActive(c.path));
                                    return (
                                        <div key={item.label} className={s.dropdownWrap}>
                                            <button
                                                className={`${s.dropdownTrigger} ${isRestricted ? s.navLinkRestricted : anyChildActive ? s.dropdownTriggerActive : ''}`}
                                            >
                                                <span>{item.label}</span>
                                                <ChevronDown size={14} style={{ marginLeft: 4 }} />
                                                {isRestricted && <span className={s.restrictedMark}>✦</span>}
                                            </button>
                                            <div className={s.dropdownMenu}>
                                                    {item.children.map(child => (
                                                        <Link
                                                            key={child.path}
                                                            href={isRestricted ? `/coming-soon?feature=${item.featureKey || ''}` : child.path}
                                                            className={`${s.dropdownItem} ${isActive(child.path) ? s.dropdownItemActive : ''}`}
                                                        >
                                                            <span className={s.dropdownItemLabel}>{child.label}</span>
                                                            {child.description && (
                                                                <span className={s.dropdownItemDesc}>{child.description}</span>
                                                            )}
                                                        </Link>
                                                    ))}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.path}
                                        href={isRestricted ? `/coming-soon?feature=${item.featureKey || ''}` : item.path}
                                        className={`${s.navLink} ${isRestricted ? s.navLinkRestricted : isActive(item.path) ? s.navLinkActive : s.navLinkIdle}`}
                                        title={isRestricted ? t('nav.membersOnly') : ''}
                                        onMouseEnter={() => prefetchRouteData(item.path)}
                                        onFocus={() => prefetchRouteData(item.path)}
                                    >
                                        <span>{item.label}</span>
                                        {isRestricted && <span className={s.restrictedMark}>✦</span>}
                                    </Link>
                                );
                            })}
                            {canEditPolitics && !isAdminUser && (
                                <div className={s.dropdownWrap}>
                                    <div className={s.dropdownTrigger}>
                                        <FileText size={16} style={{ marginRight: 8 }} />
                                        <span>{t('nav.editorial')}</span>
                                    </div>
                                    <div className={s.dropdownMenu}>
                                            <Link href="/admin/politics/upload"
                                                className={`${s.dropdownItem} ${isActive('/admin/politics/upload') ? s.dropdownItemActive : ''}`}
                                            >
                                                Politics Upload
                                            </Link>
                                    </div>
                                </div>
                            )}

                            {isAdminUser && (
                                <div className={s.dropdownWrap}>
                                    <div className={s.dropdownTrigger}>
                                        <Shield size={16} style={{ marginRight: 8 }} />
                                        <span>{t('nav.admin')}</span>
                                    </div>
                                    <div className={s.dropdownMenu}>
                                            {[
                                                { to: '/admin/tags', label: 'Category & Tag Management' },
                                                { to: '/admin/roles', label: 'User Role Management' },
                                                { to: '/admin/submissions', label: 'Review Submissions' },
                                                { to: '/admin/knowledge', label: 'Knowledge Moderation' },
                                                { to: '/admin/quizzes', label: 'Quiz Management' },
                                                { to: '/admin/scenarios', label: 'Scenario Management' },
                                                { to: '/admin/world-sim', label: 'World Sim' },
                                                { to: '/admin/analysis/upload', label: 'Upload Analysis Text' },
                                                { to: '/admin/library/upload', label: 'Library Upload' },
                                                { to: '/admin/politics/upload', label: 'Politics Upload' },
                                                { to: '/admin/stem', label: 'STEM Courses' },
                                            ].map((link) => (
                                                <Link
                                                    key={link.to}
                                                    href={link.to}
                                                    className={`${s.dropdownItem} ${isActive(link.to) ? s.dropdownItemActive : ''}`}
                                                >
                                                    {link.label}
                                                </Link>
                                            ))}
                                    </div>
                                </div>
                            )}
                            {user && (
                                <Link
                                    href="/profile"
                                    className={`${s.navLink} ${isActive('/profile') ? s.navLinkActive : s.navLinkIdle}`}
                                >
                                    {t('nav.profile')}
                                </Link>
                            )}
                        </nav>
                    </div>

                    <div className={`${s.bandSlot} ${s.bandSlotRight}`}>
                        <span className={s.bandMark} aria-hidden="true">
                            <Sun size={15} strokeWidth={1.8} />
                        </span>
                        {user ? (
                            <button
                                onClick={handleLogout}
                                className={s.iconButton}
                                title={t('nav.logout')}
                            >
                                <LogOut size={18} />
                            </button>
                        ) : (
                            <Link href="/login" className={s.loginButton}>
                                {t('nav.login')}
                            </Link>
                        )}
                        {/* Mobile Menu Button */}
                        <button
                            className={s.mobileMenuBtn}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (                <div className={s.mobileOverlay}>
                    <div className={s.mobileInner}>
                        <div className={s.mobileCloseRow}>
                            <button className={s.mobileCloseButton} onClick={() => setMobileMenuOpen(false)}>
                                <Menu size={22} />
                            </button>
                        </div>
                        <nav className={s.mobileNavStack}>
                            {navItems.map((item) => {
                                const isRestricted = !user && !item.guestAccessible;

                                if (item.children) {
                                    return (
                                        <div key={item.label}>
                                            <span className={s.mobileGroupLabel}>{item.label}</span>
                                            <div className={s.mobileSubStack}>
                                                {item.children.map(child => (
                                                    <Link
                                                        key={child.path}
                                                        href={isRestricted ? `/coming-soon?feature=${item.featureKey || ''}` : child.path}
                                                        className={`${s.mobileSubLink} ${isActive(child.path) ? s.mobileLinkActive : ''}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        {child.label}
                                                        {child.description && (
                                                            <span className={s.mobileSubDesc}>{child.description}</span>
                                                        )}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <Link 
                                        key={item.path}
                                        href={isRestricted ? `/coming-soon?feature=${item.featureKey || ''}` : item.path}
                                        className={`${s.mobileLink} ${isRestricted ? s.mobileLinkRestricted : isActive(item.path) ? s.mobileLinkActive : ''}`}
                                        onMouseEnter={() => prefetchRouteData(item.path)}
                                        onFocus={() => prefetchRouteData(item.path)}
                                        onTouchStart={() => prefetchRouteData(item.path)}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <span>{item.label}</span>
                                        {isRestricted && <span className={s.mobileComingSoon}>{t('nav.membersOnly')}</span>}
                                    </Link>
                                );
                            })}
                            {isAdminUser && (
                                <>
                                    <Link href="/admin/tags"
                                        className={`${s.mobileLink} ${isActive('/admin/tags') ? s.mobileLinkActive : ''}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Shield size={20} style={{ marginRight: 8 }} />
                                        <span>{t('nav.adminTools')}</span>
                                    </Link>
                                    <Link href="/admin/roles"
                                        className={`${s.mobileSubLink} ${isActive('/admin/roles') ? s.mobileLinkActive : ''}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Role Management
                                    </Link>
                                    <Link href="/admin/politics/upload"
                                        className={`${s.mobileSubLink} ${isActive('/admin/politics/upload') ? s.mobileLinkActive : ''}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Politics Upload
                                    </Link>
                                </>
                            )}
                            {!isAdminUser && canEditPolitics && (
                                <Link href="/admin/politics/upload"
                                    className={`${s.mobileLink} ${isActive('/admin/politics/upload') ? s.mobileLinkActive : ''}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <FileText size={20} style={{ marginRight: 8 }} />
                                    <span>Politics Upload</span>
                                </Link>
                            )}
                            {user && (
                                <Link href="/profile"
                                    className={s.mobileLink}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span>{t('nav.myProfile')}</span>
                                </Link>
                            )}
                        </nav>
                        <div className={s.mobileActions}>
                            {user ? (
                                <button
                                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                    className={s.mobileLogout}
                                >
                                    <LogOut size={18} />
                                    <span>{t('nav.logout')}</span>
                                </button>
                            ) : (
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={s.loginButton}>
                                    {t('nav.login')}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
