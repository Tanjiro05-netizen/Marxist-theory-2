import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, LogOut, BarChart, BookOpen, FileText, Home, BookMarked, LineChart, Users, Shield, HelpCircle, ChevronDown, Newspaper, Radio, Search } from 'lucide-react';
import Link from 'next/link';
import { prefetchRouteData, prefetchAllRoutesWhenIdle } from '../lib/routePrefetch';
import { lockPageScroll } from '../utils/scrollLock';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useSitePresence from '../hooks/useSitePresence';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import GlobalSearch from './GlobalSearch/GlobalSearch';
import * as s from './Header.css.ts';

const Header = ({ bandStatic = false }) => {
    const { user, logout, isAdmin, canManagePolitics } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuButtonRef = useRef(null);
    const menuRef = useRef(null);

    /* Cmd/Ctrl+K toggles the site-wide search palette */
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setMobileMenuOpen(false);
                setSearchOpen((openState) => !openState);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    /* Sliding plate — one pill glides between nav items and rests on the
       active page. Measured from the real DOM so it tracks wrap and resize. */
    const navRowRef = useRef(null);
    const indicatorRef = useRef(null);

    const moveIndicatorTo = useCallback((el) => {
        const row = navRowRef.current;
        const plate = indicatorRef.current;
        if (!row || !plate || !el) return;
        const rowRect = row.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        plate.style.width = `${rect.width}px`;
        plate.style.height = `${rect.height}px`;
        plate.style.transform = `translateX(${rect.left - rowRect.left}px) translateY(${rect.top - rowRect.top}px)`;
        plate.style.opacity = '1';
    }, []);

    const handleNavEnter = useCallback((event) => {
        moveIndicatorTo(event.currentTarget);
    }, [moveIndicatorTo]);

    const handleNavLeave = useCallback(() => {
        const active = navRowRef.current?.querySelector('[data-nav-active="true"]');
        if (active) moveIndicatorTo(active);
    }, [moveIndicatorTo]);

    /* Rest the plate on the active item on mount, route change, and resize */
    useEffect(() => {
        const rest = () => {
            const active = navRowRef.current?.querySelector('[data-nav-active="true"]');
            if (active) moveIndicatorTo(active);
        };
        rest();
        const t = setTimeout(rest, 400); // after fonts settle, widths shift
        window.addEventListener('resize', rest);
        return () => { clearTimeout(t); window.removeEventListener('resize', rest); };
    }, [pathname, user, moveIndicatorTo]);

    /* Lift the band once the page scrolls under it */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const unlockPageScroll = lockPageScroll();
        const menu = menuRef.current;
        menu?.querySelector('button')?.focus();
        const handleKey = (event) => {
            if (event.key === 'Escape') setMobileMenuOpen(false);
            if (event.key !== 'Tab' || !menu) return;
            const elements = [...menu.querySelectorAll('a[href], button:not([disabled])')];
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        };
        const desktop = window.matchMedia('(min-width: 1200px)');
        const handleResize = () => { if (desktop.matches) setMobileMenuOpen(false); };
        document.addEventListener('keydown', handleKey);
        desktop.addEventListener('change', handleResize);
        return () => {
            unlockPageScroll();
            document.removeEventListener('keydown', handleKey);
            desktop.removeEventListener('change', handleResize);
            menuButtonRef.current?.focus({ preventScroll: true });
        };
    }, [mobileMenuOpen]);

    const isAdminUser = isAdmin();
    const canEditPolitics = canManagePolitics();

    /* Every visitor joins the shared presence channel (the count depends on
       it); the badge itself renders for admins only. */
    const presence = useSitePresence(user?.id || null);
    const liveTitle = presence
        ? `${t('nav.onlineNow')}: ${presence.total} · ${t('nav.onlineMembers')} ${presence.members} · ${t('nav.onlineGuests')} ${presence.guests}`
        : undefined;

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
                { path: '/theory', label: t('nav.theoryRead') },
                { path: '/analysis', label: t('nav.theoryAnalyze') },
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
                    {/* The landing page's wordmark travels into this one on
                        the way in; NavTransition waits for this to be on
                        screen before it snapshots. */}
                    <span className={s.mastheadWord} data-site-wordmark>
                        Marxist<span className={s.mastheadDot}>.</span>info
                    </span>
                    <span className={s.mastheadRule} aria-hidden="true" />
                </Link>
            </div>

            {/* Frosted parchment navband — sticky, unless the route opts into
               an immersive read (the band then scrolls away with the masthead) */}
            <div className={`${s.navband}${bandStatic ? ` ${s.navbandStatic}` : ''}${scrolled && !bandStatic ? ` ${s.navbandScrolled}` : ''}`}>
                <div className={s.navbandInner}>
                    <div className={s.bandSlot}>
                        <button
                            type="button"
                            className={s.bandIconButton}
                            onClick={() => setSearchOpen(true)}
                            title={t('nav.searchLibrary')}
                            aria-label={t('nav.searchLibrary')}
                            aria-haspopup="dialog"
                        >
                            <Search size={15} strokeWidth={1.8} />
                        </button>
                        <LanguageSwitcher />
                    </div>

                    {/* Desktop Navigation */}
                    <div className={s.desktopNav}>
                        <nav ref={navRowRef} className={s.navRow} onMouseLeave={handleNavLeave}>
                            <span ref={indicatorRef} className={s.navIndicator} aria-hidden="true" />
                            {navItems.map((item) => {
                                const isRestricted = !user && !item.guestAccessible;

                                if (item.children) {
                                    const anyChildActive = item.children.some(c => isActive(c.path));
                                    return (
                                        <div key={item.label} className={s.dropdownWrap} onMouseEnter={handleNavEnter}>
                                            <button
                                                data-nav-active={anyChildActive || undefined}
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
                                        data-nav-active={isActive(item.path) || undefined}
                                        className={`${s.navLink} ${isRestricted ? s.navLinkRestricted : isActive(item.path) ? s.navLinkActive : s.navLinkIdle}`}
                                        title={isRestricted ? t('nav.membersOnly') : ''}
                                        onMouseEnter={(e) => { handleNavEnter(e); prefetchRouteData(item.path); }}
                                        onFocus={(e) => { handleNavEnter(e); prefetchRouteData(item.path); }}
                                    >
                                        <span>{item.label}</span>
                                        {isRestricted && <span className={s.restrictedMark}>✦</span>}
                                    </Link>
                                );
                            })}
                            {canEditPolitics && !isAdminUser && (
                                <div className={`${s.dropdownWrap} ${s.navExtra}`}>
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
                                <div className={`${s.dropdownWrap} ${s.navExtra}`}>
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
                        {isAdminUser && presence && (
                            <span className={s.liveBadge} title={liveTitle} aria-label={liveTitle}>
                                <span className={s.liveDot} aria-hidden="true" />
                                {presence.total}
                            </span>
                        )}
                        <ThemeToggle />
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
                            ref={menuButtonRef}
                            aria-label="Open navigation menu"
                            aria-expanded={mobileMenuOpen}
                            aria-controls="mobile-navigation"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (                <div className={s.mobileOverlay} id="mobile-navigation" ref={menuRef} role="dialog" aria-modal="true" aria-label="Navigation menu">
                    <div className={s.mobileInner}>
                        <div className={s.mobileCloseRow}>
                            <button className={s.mobileCloseButton} aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)}>
                                <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1 }}>×</span>
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
                            {isAdminUser && presence && (
                                <span className={s.liveBadge} title={liveTitle} aria-label={liveTitle}>
                                    <span className={s.liveDot} aria-hidden="true" />
                                    {presence.total}
                                </span>
                            )}
                            <ThemeToggle />
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

            {/* Site-wide search palette (header icon or Cmd/Ctrl+K) */}
            <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    );
};

export default Header;
