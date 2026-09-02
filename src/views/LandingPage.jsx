import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { 
    BookOpen, MessageSquare, LogIn, UserPlus, 
    Mail, ArrowRight, CheckCircle, AlertTriangle, Loader2,
    X, Eye, Sparkles, ExternalLink, Heart,
    GraduationCap, FlaskConical, BarChart3, PenTool,
    Layers, Upload
} from 'lucide-react';
import MarxBg from '../assets/Marx.jpg';
import DonationModal from '../components/DonationModal';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';

const marxBgUrl = typeof MarxBg === 'string' ? MarxBg : MarxBg.src;

const LandingPage = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const { login, signUp } = useAuth();
    
    // Modal states
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [showDonatedBanner, setShowDonatedBanner] = useState(
        () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('donated') === 'true'
    );

    // Login modal is now only opened by explicit user click on "Log In" buttons
    
    // Login form
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    
    // Register form
    const [registerData, setregisterData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        inviteCode: '',
        betaReason: ''
    });
    const [registerError, setRegisterError] = useState('');
    const [registerLoading, setregisterLoading] = useState(false);
    const [registerSuccess, setregisterSuccess] = useState(false);
    const [hasInviteCode, setHasInviteCode] = useState(false);
    
    // Email signup (waitlist)
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistLoading, setWaitlistLoading] = useState(false);
    const [waitlistSuccess, setWaitlistSuccess] = useState(false);
    const [waitlistError, setWaitlistError] = useState('');
    const [notifyInvites, setNotifyInvites] = useState(true);
    const [notifyBeta, setNotifyBeta] = useState(true);

    // View mode toggle
    const [viewMode, setViewMode] = useState('normal');

    // Mouse tracking state (cinematic view)
    const rootRef = useRef(null);
    const revealRef = useRef(null);
    const bgTopRef = useRef(null);
    const gridRef = useRef(null);
    const mousePos = useRef({ x: -300, y: -300 });
    const prevMousePos = useRef({ x: -300, y: -300 });
    const animFrameRef = useRef(null);
    const echoContainerRef = useRef(null);
    const highlightableRefs = useRef([]);
    const parallaxRefs = useRef([]);
    const titleRef = useRef(null);

    const registerHighlightable = useCallback((el) => {
        if (el && !highlightableRefs.current.includes(el)) {
            highlightableRefs.current.push(el);
        }
    }, []);

    const registerParallax = useCallback((el) => {
        if (el && !parallaxRefs.current.includes(el)) {
            parallaxRefs.current.push(el);
        }
    }, []);

    // Mouse tracking + reveal + echo + highlight + parallax (cinematic view)
    useEffect(() => {
        if (viewMode !== 'cinematic') return;

        const root = rootRef.current;
        const reveal = revealRef.current;
        const bgTop = bgTopRef.current;
        const grid = gridRef.current;
        const echoContainer = echoContainerRef.current;
        if (!root || !reveal) return;

        let lastEchoTime = 0;

        const handleMouseMove = (e) => {
            prevMousePos.current = { ...mousePos.current };
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const tick = () => {
            const { x, y } = mousePos.current;
            const prev = prevMousePos.current;

            reveal.style.setProperty('--mouse-x', `${x}px`);
            reveal.style.setProperty('--mouse-y', `${y}px`);
            if (bgTop) {
                bgTop.style.setProperty('--mouse-x', `${x}px`);
                bgTop.style.setProperty('--mouse-y', `${y}px`);
            }

            if (grid) {
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                grid.style.setProperty('--grid-x', `${(x - cx) * 0.02}`);
                grid.style.setProperty('--grid-y', `${(y - cy) * 0.02}`);
            }

            const dx = x - prev.x;
            const dy = y - prev.y;
            const velocity = Math.sqrt(dx * dx + dy * dy);
            const now = Date.now();

            if (velocity > 8 && now - lastEchoTime > 50 && echoContainer) {
                lastEchoTime = now;
                const echo = document.createElement('div');
                echo.className = 'landing-echo';
                echo.innerHTML = '<span style="color:#b3122e">Marxist</span><span style="color:#fff">.info</span>';
                echo.style.maskImage = `radial-gradient(circle 160px at ${x}px ${y}px, rgba(0,0,0,0.6) 0%, transparent 70%)`;
                echo.style.webkitMaskImage = echo.style.maskImage;
                echoContainer.appendChild(echo);
                setTimeout(() => {
                    if (echo.parentNode) echo.parentNode.removeChild(echo);
                }, 650);
            }

            const spotRadius = 200;
            if (titleRef.current) {
                const tRect = titleRef.current.getBoundingClientRect();
                const tCx = tRect.left + tRect.width / 2;
                const tCy = tRect.top + tRect.height / 2;
                const tDist = Math.sqrt((x - tCx) ** 2 + (y - tCy) ** 2);
                const tThreshold = spotRadius + Math.max(tRect.width, tRect.height) / 2;
                if (tDist < tThreshold) {
                    titleRef.current.classList.add('title-revealed');
                } else {
                    titleRef.current.classList.remove('title-revealed');
                }
            }

            highlightableRefs.current.forEach((el) => {
                if (!el) return;
                const rect = el.getBoundingClientRect();
                const elCx = rect.left + rect.width / 2;
                const elCy = rect.top + rect.height / 2;
                const dist = Math.sqrt((x - elCx) ** 2 + (y - elCy) ** 2);
                const threshold = spotRadius + Math.max(rect.width, rect.height) / 2;
                if (dist < threshold) {
                    el.classList.add('highlighted');
                } else {
                    el.classList.remove('highlighted');
                }
            });

            const cx2 = window.innerWidth / 2;
            const cy2 = window.innerHeight / 2;
            parallaxRefs.current.forEach((el) => {
                if (!el) return;
                const factor = parseFloat(el.dataset.parallax || '0.015');
                const tx = -(x - cx2) * factor;
                const ty = -(y - cy2) * factor;
                el.style.transform = `translate(${tx}px, ${ty}px)`;
            });

            animFrameRef.current = requestAnimationFrame(tick);
        };

        window.addEventListener('mousemove', handleMouseMove);
        animFrameRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [viewMode]);

    // Feature card data (cinematic view) — shares wording with the normal view
    const features = [
        { icon: GraduationCap, title: t('landing.featStudyTitle'), desc: t('landing.featStudyDesc') },
        { icon: FlaskConical, title: t('nav.scienceTech'), desc: t('landing.featScienceDesc') },
        { icon: BookOpen, title: t('nav.library'), desc: t('landing.featLibraryDesc') },
        { icon: BarChart3, title: t('nav.data'), desc: t('landing.featDataDesc') },
        { icon: PenTool, title: t('landing.featWritersTitle'), desc: t('landing.featWritersDesc') },
        { icon: MessageSquare, title: t('landing.featForumTitle'), desc: t('landing.featForumDesc') },
    ];

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);

        try {
            const result = await login({ email: loginEmail, password: loginPassword });

            if (result.error) {
                setLoginError(result.error.message);
            } else {
                setShowLoginModal(false);
                router.push('/home');
            }
        } catch (err) {
            setLoginError(err.message || t('landing.errLoginFailed'));
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegisterError('');
        
        if (registerData.password !== registerData.confirmPassword) {
            setRegisterError(t('landing.errPasswords'));
            return;
        }
        
        if (registerData.username.length < 3) {
            setRegisterError(t('landing.errUsernameMin'));
            return;
        }

        setregisterLoading(true);
        
        // Pre-validate invite code via secure RPC before signup
        if (hasInviteCode && registerData.inviteCode) {
            const { data: validation, error: valError } = await supabase.rpc('validate_invite_code', {
                p_code: registerData.inviteCode
            });
            if (valError || !validation?.valid) {
                setRegisterError(t('landing.errInvalidInvite'));
                setregisterLoading(false);
                return;
            }
        }

        const result = await signUp({
            email: registerData.email,
            password: registerData.password,
            username: registerData.username,
            inviteCode: hasInviteCode ? registerData.inviteCode : null,
            betaReason: !hasInviteCode ? registerData.betaReason : null
        });
        
        if (result.error) {
            setRegisterError(result.error.message);
        } else {
            setregisterSuccess(true);
        }
        setregisterLoading(false);
    };

    const handleWaitlistSignup = async (e) => {
        e.preventDefault();
        setWaitlistError('');
        setWaitlistLoading(true);
        
        try {
            const { data, error } = await supabase.functions.invoke('waitlist-signup', {
                body: {
                    email: waitlistEmail.trim().toLowerCase(),
                    notify_invite_codes: notifyInvites,
                    notify_public_beta: notifyBeta,
                },
            });

            if (error) {
                setWaitlistError(t('landing.errJoinFailed'));
            } else if (data?.alreadyExists) {
                setWaitlistError(t('landing.errAlreadyList'));
            } else if (data?.error) {
                setWaitlistError(data.error);
            } else {
                setWaitlistSuccess(true);
                setregisterSuccess(true);
            }
        } catch (err) {
            setWaitlistError(t('landing.errJoinFailed'));
        }
        setWaitlistLoading(false);
    };

    const handleGuestAccess = () => {
        router.push('/home');
    };

    // Toggle button (shared across both views)
    const toggleButton = (
        <button
            onClick={() => setViewMode(v => v === 'cinematic' ? 'normal' : 'cinematic')}
            className="fixed top-5 left-5 z-[200] flex items-center gap-2 px-4 py-2.5 rounded-none bg-[#0b0d12]/90 border border-[#262a35] font-[Outfit,sans-serif] text-[10px] font-medium uppercase tracking-[0.22em] text-[#a5a194] hover:text-[#ece9e0] hover:border-[#d41f3d] transition-colors"
            title={viewMode === 'cinematic' ? t('landing.switchNormal') : t('landing.switchCinematic')}
        >
            <Layers size={13} strokeWidth={1.8} />
            {viewMode === 'cinematic' ? t('landing.normalView') : t('landing.cinematicView')}
        </button>
    );

    // ===== CINEMATIC VIEW =====
    if (viewMode === 'cinematic') {
        return (
            <div className="landing-root" ref={rootRef}>
                {toggleButton}

                {/* Background layers */}
                <div className="landing-bg-top" ref={bgTopRef} style={{ backgroundImage: 'url(/marx-background.png)' }} />

                {/* Hidden text layer — revealed by cursor spotlight */}
                <div className="landing-reveal-layer landing-reveal-text" ref={revealRef}>
                    <span className="landing-reveal-red">Marxist</span>
                    <span className="landing-reveal-white">.info</span>
                </div>
                <div ref={echoContainerRef} style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }} />
                <div className="landing-grid" ref={gridRef} />

                {/* ===== Content ===== */}
                <div className="landing-content">

                    {/* Hero Section */}
                    <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">
                        <div className="landing-parallax" data-parallax="0.02" ref={registerParallax}>
                            <h1 
                                className="landing-title-content text-6xl md:text-8xl font-extrabold mb-5 tracking-tight"
                                ref={titleRef}
                            >
                                <span 
                                    className="landing-title-red landing-highlightable" 
                                    ref={registerHighlightable}
                                >
                                    Marxist
                                </span>
                                <span 
                                    className="landing-title-white landing-highlightable" 
                                    ref={registerHighlightable}
                                >
                                    .info
                                </span>
                            </h1>

                            <div className="flex flex-wrap justify-center gap-4 mb-6">
                                <button
                                    onClick={handleGuestAccess}
                                    className="btn-secondary landing-highlightable flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white"
                                    ref={registerHighlightable}
                                >
                                    <Eye size={20} />
                                    {t('landing.browseGuest')}
                                </button>
                                <button
                                    onClick={() => setShowLoginModal(true)}
                                    className="btn-primary-red landing-highlightable flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white"
                                    ref={registerHighlightable}
                                >
                                    <LogIn size={20} />
                                    {t('landing.logIn')}
                                </button>
                                <button
                                    onClick={() => router.push('/submit')}
                                    className="btn-outlined-red landing-highlightable flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white"
                                    ref={registerHighlightable}
                                >
                                    <Upload size={20} />
                                    {t('submit.submitWork')}
                                </button>
                                <button
                                    onClick={() => setShowRegisterModal(true)}
                                    className="btn-outlined-red landing-highlightable flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white"
                                    ref={registerHighlightable}
                                >
                                    <UserPlus size={20} />
                                    {t('landing.register')}
                                </button>
                            </div>
                            <button
                                onClick={() => setShowAboutModal(true)}
                                className="landing-highlightable text-gray-500 hover:text-white transition text-sm font-medium tracking-wide"
                                ref={registerHighlightable}
                            >
                                {t('landing.aboutProject')}
                            </button>
                        </div>
                    </section>

                    {/* {t('landing.visionTitle')} */}
                    <section className="max-w-3xl mx-auto px-4 pb-24">
                        <div className="landing-parallax glass-card p-8 md:p-10" data-parallax="0.01" ref={registerParallax}>
                            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">{t('landing.visionTitle')}</h2>
                            <p className="text-gray-300 mb-5 leading-relaxed">
                                {t('landing.visionP1')}
                            </p>
                            <p className="text-gray-300 mb-5 leading-relaxed">
                                {t('landing.visionP2')}
                            </p>
                            <p className="text-gray-300 mb-8 leading-relaxed">
                                {t('landing.visionP3')}
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                                <a 
                                    href="https://x.com/Leninistwarrior" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="landing-highlightable flex items-center gap-2 text-red-400 hover:text-red-300 transition font-medium"
                                    ref={registerHighlightable}
                                >
                                    <ExternalLink size={16} />
                                    {t('landing.twitter')}
                                </a>
                                <a
                                    href="https://JinbuJYG.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="landing-highlightable flex items-center gap-2 text-red-400 hover:text-red-300 transition font-medium"
                                    ref={registerHighlightable}
                                >
                                    <ExternalLink size={16} />
                                    JinbuJYG.com
                                </a>
                                <button
                                    onClick={() => setShowDonationModal(true)}
                                    className="landing-highlightable btn-donate flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition"
                                    ref={registerHighlightable}
                                >
                                    <Heart size={18} />
                                    {t('landing.supportProject')}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* {t('landing.featuresTitle')} */}
                    <section className="max-w-6xl mx-auto px-4 pb-24">
                        <div className="landing-parallax" data-parallax="0.008" ref={registerParallax}>
                            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-white">{t('landing.featuresTitle')}</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {features.map((f, i) => {
                                    const Icon = f.icon;
                                    return (
                                        <div key={i} className="glass-card-feature p-6">
                                            <Icon className="text-red-700 mb-4" size={32} />
                                            <h3 className="text-xl font-bold mb-2 text-white">{f.title}</h3>
                                            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* {t('landing.stayUpdatedTitle')} */}
                    <section className="max-w-xl mx-auto px-4 pb-24">
                        <div className="landing-parallax glass-card p-8" data-parallax="0.01" ref={registerParallax}>
                            <div className="flex items-center gap-2 mb-4">
                                <Mail className="text-red-700" size={24} />
                                <h2 className="text-2xl font-bold text-white">{t('landing.stayUpdatedTitle')}</h2>
                            </div>
                            <p className="text-gray-400 mb-6">
                                {t('landing.stayUpdatedDesc')}
                            </p>
                            
                            {waitlistSuccess ? (
                                <div className="text-center py-4">
                                    <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
                                    <p className="text-green-400 font-semibold">{t('landing.onTheList')}</p>
                                    <p className="text-gray-400 text-sm">{t('landing.notifySpots')}</p>
                                </div>
                            ) : (
                                <form onSubmit={handleWaitlistSignup} className="space-y-4">
                                    <input
                                        type="email"
                                        value={waitlistEmail}
                                        onChange={(e) => setWaitlistEmail(e.target.value)}
                                        placeholder={t('landing.emailPlaceholder')}
                                        className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-800 focus:outline-none text-white placeholder-gray-500"
                                        required
                                    />
                                    <div className="flex flex-col gap-2 text-sm">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notifyInvites}
                                                onChange={(e) => setNotifyInvites(e.target.checked)}
                                                className="accent-red-800"
                                            />
                                            <span className="text-gray-300">{t('landing.notifyInvites')}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notifyBeta}
                                                onChange={(e) => setNotifyBeta(e.target.checked)}
                                                className="accent-red-800"
                                            />
                                            <span className="text-gray-300">{t('landing.notifyBeta')}</span>
                                        </label>
                                    </div>
                                    {waitlistError && (
                                        <p className="text-red-500 text-sm flex items-center gap-1">
                                            <AlertTriangle size={14} /> {waitlistError}
                                        </p>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={waitlistLoading}
                                        className="w-full p-3 btn-primary-red rounded-lg font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {waitlistLoading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                                        {waitlistLoading ? t('landing.joining') : t('landing.joinList')}
                                    </button>
                                </form>
                            )}
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="border-t border-gray-800/50 py-8">
                        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600 text-sm">
                            <p>&copy; 2026 Marxist.info &mdash; {t('landing.tagline')}</p>
                            <p className="mt-2">
                                {t('landing.madeOwned')}{' '}
                                <a
                                    href="https://JinbuJYG.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-red-500 transition hover:text-red-400"
                                >
                                    JinbuJYG.com
                                </a>
                            </p>
                        </div>
                    </footer>
                </div>

                {/* ===== SUCCESS BANNER ===== */}
                {showDonatedBanner && (
                    <div
                        style={{
                            position: 'fixed',
                            top: '1.25rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 300,
                            background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
                            border: '1px solid rgba(74,222,128,0.35)',
                            borderRadius: '14px',
                            padding: '0.75rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            color: '#86efac',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <CheckCircle size={18} />
                        {t('landing.donatedBanner')}
                        <button
                            onClick={() => setShowDonatedBanner(false)}
                            style={{ marginLeft: '0.5rem', opacity: 0.7, cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Donation Modal */}
                {showDonationModal && (
                    <DonationModal onClose={() => setShowDonationModal(false)} />
                )}

                {/* ===== CINEMATIC MODALS ===== */}

                {/* Login Modal */}
                {showLoginModal && (
                    <div className="modal-backdrop">
                        <div className="modal-panel">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">{t('landing.logIn')}</h2>
                                <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-white transition">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.emailLabel')}</label>
                                    <input
                                        type="email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        className="w-full p-3"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.passwordLabel')}</label>
                                    <input
                                        type="password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="w-full p-3"
                                        required
                                    />
                                </div>
                                {loginError && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-red-500 text-sm">
                                        <p className="flex min-w-0 flex-1 items-start gap-1">
                                            <AlertTriangle className="mt-0.5 shrink-0" size={14} /> {loginError}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleLogin}
                                            disabled={loginLoading}
                                            className="shrink-0 rounded border border-red-500/50 px-3 py-1 font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {t('landing.retry')}
                                        </button>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={loginLoading}
                                    className="modal-btn-primary w-full p-3 flex items-center justify-center gap-2"
                                >
                                    {loginLoading && <Loader2 className="animate-spin" size={20} />}
                                    {loginLoading ? t('landing.loggingIn') : t('landing.logIn')}
                                </button>
                            </form>
                            <p className="text-center text-gray-500 mt-4 text-sm">
                                {t('landing.noAccountPrefix')}{' '}
                                <button 
                                    onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
                                    className="text-red-500 hover:underline"
                                >
                                    {t('landing.register')}
                                </button>
                            </p>
                        </div>
                    </div>
                )}

                {/* Register Modal */}
                {showRegisterModal && (
                    <div className="modal-backdrop">
                        <div className="modal-panel">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">{t('landing.createAccount')}</h2>
                                <button onClick={() => { setShowRegisterModal(false); setregisterSuccess(false); setWaitlistError(''); setRegisterError(''); }} className="text-gray-400 hover:text-white transition">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            {registerSuccess ? (
                                <div className="text-center py-8">
                                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                                    {hasInviteCode ? (
                                        <>
                                            <h3 className="text-xl font-semibold mb-2 text-white">{t('landing.checkEmailTitle')}</h3>
                                            <p className="text-gray-300 mb-4">
                                                {t('landing.sentLinkTo')} <span className="text-red-500">{registerData.email}</span>
                                            </p>
                                            <p className="text-green-400 text-sm">
                                                <Sparkles size={16} className="inline mr-1" />
                                                {t('landing.inviteApplied')}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-xl font-semibold mb-2 text-white">{t('landing.onTheList')}</h3>
                                            <p className="text-gray-300">
                                                We'll notify <span className="text-red-500">{registerData.email}</span> {t('landing.notifySpots')}
                                            </p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={hasInviteCode ? handleRegister : handleWaitlistSignup} className="space-y-4">
                                    <div className="bg-white/5 p-4 rounded-lg mb-4 border border-gray-700/50">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasInviteCode}
                                                onChange={(e) => { setHasInviteCode(e.target.checked); setRegisterError(''); }}
                                                className="accent-red-800"
                                            />
                                            <span className="font-medium text-white">{t('landing.haveInviteCode')}</span>
                                        </label>
                                        <p className="text-gray-500 text-xs mt-1">
                                            {t('landing.inviteGrant')}
                                        </p>
                                    </div>

                                    {hasInviteCode ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-1">
                                                    <Sparkles size={14} className="text-yellow-500" /> {t('landing.inviteCodeLabel')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={registerData.inviteCode}
                                                    onChange={(e) => setregisterData({...registerData, inviteCode: e.target.value.toUpperCase()})}
                                                    className="w-full p-3 uppercase tracking-wider"
                                                    style={{ borderColor: 'rgba(202,138,4,0.5)' }}
                                                    placeholder={t("landing.inviteCodeLabel").slice(0,4) + "-XXXX"}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.usernameLabel')}</label>
                                                <input
                                                    type="text"
                                                    value={registerData.username}
                                                    onChange={(e) => setregisterData({...registerData, username: e.target.value})}
                                                    className="w-full p-3"
                                                    placeholder={t('landing.usernamePlaceholder')}
                                                    minLength={3}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.emailLabel')}</label>
                                                <input
                                                    type="email"
                                                    value={registerData.email}
                                                    onChange={(e) => setregisterData({...registerData, email: e.target.value})}
                                                    className="w-full p-3"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.passwordLabel')}</label>
                                                <input
                                                    type="password"
                                                    value={registerData.password}
                                                    onChange={(e) => setregisterData({...registerData, password: e.target.value})}
                                                    className="w-full p-3"
                                                    placeholder={t('landing.passwordPlaceholder')}
                                                    minLength={6}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.confirmPassword')}</label>
                                                <input
                                                    type="password"
                                                    value={registerData.confirmPassword}
                                                    onChange={(e) => setregisterData({...registerData, confirmPassword: e.target.value})}
                                                    className="w-full p-3"
                                                    required
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.emailLabel')}</label>
                                                <input
                                                    type="email"
                                                    value={waitlistEmail}
                                                    onChange={(e) => setWaitlistEmail(e.target.value)}
                                                    className="w-full p-3"
                                                    placeholder={t('landing.yourEmail')}
                                                    required
                                                />
                                            </div>
                                            <p className="text-gray-500 text-xs">
                                                {t('landing.notifyNoAccount')}
                                            </p>
                                        </>
                                    )}

                                    {(registerError || waitlistError) && (
                                        <p className="text-red-500 text-sm flex items-center gap-1">
                                            <AlertTriangle size={14} /> {registerError || waitlistError}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={registerLoading || waitlistLoading}
                                        className="modal-btn-primary w-full p-3 flex items-center justify-center gap-2"
                                    >
                                        {(registerLoading || waitlistLoading) && <Loader2 className="animate-spin" size={20} />}
                                        {registerLoading ? t('landing.creatingAccount') : waitlistLoading ? t('landing.joining') : hasInviteCode ? t('landing.register') : t('landing.joinWaitlist')}
                                    </button>
                                </form>
                            )}
                            
                            <p className="text-center text-gray-500 mt-4 text-sm">
                                {t('landing.hasAccountPrefix')}{' '}
                                <button 
                                    onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
                                    className="text-red-500 hover:underline"
                                >
                                    {t('landing.logIn')}
                                </button>
                            </p>
                        </div>
                    </div>
                )}

                {/* About Modal */}
                {showAboutModal && (
                    <div className="modal-backdrop">
                        <div className="modal-panel modal-panel-wide">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">{t('landing.aboutTitle')}</h2>
                                <button onClick={() => setShowAboutModal(false)} className="text-gray-400 hover:text-white transition">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="max-w-none">
                                <p className="text-gray-300 mb-5 leading-relaxed">
                                    {t('landing.aboutP1')}
                                </p>
                                
                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">{t('landing.whatWeOffer')}</h3>
                                <ul className="text-gray-300 space-y-2 list-disc list-inside mb-4">
                                    <li>{t('landing.offer1')}</li>
                                    <li>{t('landing.offer2')}</li>
                                    <li>{t('landing.offer3')}</li>
                                    <li>{t('landing.offer4')}</li>
                                    <li>{t('landing.offer5')}</li>
                                </ul>
                                
                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">{t('landing.earlyAccessTitle')}</h3>
                                <p className="text-gray-300 mb-4 leading-relaxed">
                                    {t('landing.earlyAccessP')}
                                </p>
                                
                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">{t('landing.guestAccessTitle')}</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    {t('landing.guestAccessP')}
                                </p>
                            </div>
                            
                            <div className="mt-8 flex gap-4">
                                <button
                                    onClick={() => { setShowAboutModal(false); setShowRegisterModal(true); }}
                                    className="modal-btn-primary flex-1 p-3"
                                >
                                    {t('landing.registerNow')}
                                </button>
                                <button
                                    onClick={() => setShowAboutModal(false)}
                                    className="modal-btn-ghost px-6 py-3"
                                >
                                    {t('landing.closeBtn')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ===== NORMAL VIEW (existing landing page) =====
    return (
        <div className="relative min-h-screen text-white" style={{ background: '#0b0d12' }}>
            {toggleButton}
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${marxBgUrl})` }}></div>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent, rgba(9,9,9,0.5), #0b0d12)' }}></div>
                
                <div className="relative max-w-6xl mx-auto px-4 py-20">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-bold mb-6">
                            <span className="text-red-600">Marxist</span>.info
                        </h1>
                        {/* Main Action Buttons */}
                        <div className="flex flex-wrap justify-center gap-4 mb-12">
                            <button
                                onClick={handleGuestAccess}
                                className="modal-btn-ghost flex items-center gap-2 px-6 py-3"
                            >
                                <Eye size={20} />
                                {t('landing.browseGuest')}
                            </button>
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="modal-btn-primary flex items-center gap-2 px-6 py-3"
                            >
                                <LogIn size={20} />
                                {t('landing.logIn')}
                            </button>
                            <button
                                onClick={() => router.push('/submit')}
                                className="btn-outlined-red flex items-center gap-2 px-6 py-3"
                            >
                                <Upload size={20} />
                                {t('submit.submitWork')}
                            </button>
                            <button
                                onClick={() => setShowRegisterModal(true)}
                                className="flex items-center gap-2 px-6 py-3 rounded-none font-semibold transition" style={{ border: '1px solid rgba(179, 18, 46,0.28)', background: 'transparent', color: '#fff' }}
                            >
                                <UserPlus size={20} />
                                {t('landing.register')}
                            </button>
                            <button
                                onClick={() => setShowAboutModal(true)}
                                className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white transition"
                            >
                                {t('landing.aboutProject')}
                            </button>
                        </div>
                    </div>

                    {/* Introduction */}
                    <div className="max-w-4xl mx-auto mb-16">
                        <div className="p-8 rounded-none" style={{ background: '#10131b', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 18px 40px rgba(0,0,0,0.42)' }}>
                            <h2 className="text-2xl font-bold mb-4">{t('landing.visionTitle')}</h2>
                            <p className="text-gray-300 mb-4">
                                {t('landing.visionP1')}
                            </p>
                            <p className="text-gray-300 mb-4">
                                {t('landing.visionP2')}
                            </p>
                            <p className="text-gray-300 mb-6">
                                {t('landing.visionP3')}
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                                <a 
                                    href="https://x.com/Leninistwarrior" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-red-400 hover:text-red-300 transition font-medium"
                                >
                                    <ExternalLink size={16} />
                                    {t('landing.twitter')}
                                </a>
                                <a
                                    href="https://JinbuJYG.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-red-400 hover:text-red-300 transition font-medium"
                                >
                                    <ExternalLink size={16} />
                                    JinbuJYG.com
                                </a>
                                <button
                                    onClick={() => setShowDonationModal(true)}
                                    className="btn-donate flex items-center gap-2 px-5 py-2.5 rounded-none font-semibold transition"
                                >
                                    <Heart size={18} />
                                    {t('landing.supportProject')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Site Features */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-center mb-8">{t('landing.featuresTitle')}</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="p-6 rounded-none" style={{ background: '#10131b', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <GraduationCap className="text-red-600 mb-4" size={32} />
                                <h3 className="text-xl font-bold mb-2">{t('landing.featStudyTitle')}</h3>
                                <p className="text-gray-400">{t('landing.featStudyDesc')}</p>
                            </div>
                            <div className="p-6 rounded-none" style={{ background: '#10131b', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <FlaskConical className="text-red-600 mb-4" size={32} />
                                <h3 className="text-xl font-bold mb-2">{t('nav.scienceTech')}</h3>
                                <p className="text-gray-400">{t('landing.featScienceDesc')}</p>
                            </div>
                            <div className="p-6 rounded-none" style={{ background: '#10131b', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <BookOpen className="text-red-600 mb-4" size={32} />
                                <h3 className="text-xl font-bold mb-2">{t('nav.library')}</h3>
                                <p className="text-gray-400">{t('landing.featLibraryDesc')}</p>
                            </div>
                            <div className="p-6 rounded-none" style={{ background: '#10131b', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <BarChart3 className="text-red-600 mb-4" size={32} />
                                <h3 className="text-xl font-bold mb-2">{t('landing.featDataTitle')}</h3>
                                <p className="text-gray-400">{t('landing.featDataDesc')}</p>
                            </div>
                            <div className="p-6 rounded-none" style={{ background: '#10131b', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <PenTool className="text-red-600 mb-4" size={32} />
                                <h3 className="text-xl font-bold mb-2">{t('landing.featWritersTitle')}</h3>
                                <p className="text-gray-400">{t('landing.featWritersDesc')}</p>
                            </div>
                            <div className="p-6 rounded-none" style={{ background: '#10131b', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <MessageSquare className="text-red-600 mb-4" size={32} />
                                <h3 className="text-xl font-bold mb-2">{t('landing.featForumTitle')}</h3>
                                <p className="text-gray-400">{t('landing.featForumDesc')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Email Signup Section */}
                    <div className="max-w-xl mx-auto p-8 rounded-none" style={{ background: '#10131b', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 18px 40px rgba(0,0,0,0.42)' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Mail className="text-red-600" size={24} />
                            <h2 className="text-2xl font-bold">{t('landing.stayUpdatedTitle')}</h2>
                        </div>
                        <p className="text-gray-400 mb-6">
                            {t('landing.stayUpdatedDesc')}
                        </p>
                        
                        {waitlistSuccess ? (
                            <div className="text-center py-4">
                                <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
                                <p className="text-green-400 font-semibold">{t('landing.onTheList')}</p>
                                <p className="text-gray-400 text-sm">{t('landing.notifySpots')}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleWaitlistSignup} className="space-y-4">
                                <input
                                    type="email"
                                    value={waitlistEmail}
                                    onChange={(e) => setWaitlistEmail(e.target.value)}
                                    placeholder={t('landing.emailPlaceholder')}
                                    className="w-full p-3 rounded-none focus:outline-none"
                                    style={{ background: '#1a1f2b', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}
                                    required
                                />
                                <div className="flex flex-col gap-2 text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notifyInvites}
                                            onChange={(e) => setNotifyInvites(e.target.checked)}
                                            className="accent-red-800"
                                        />
                                        <span className="text-gray-300">{t('landing.notifyInvites')}</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notifyBeta}
                                            onChange={(e) => setNotifyBeta(e.target.checked)}
                                            className="accent-red-800"
                                        />
                                        <span className="text-gray-300">{t('landing.notifyBeta')}</span>
                                    </label>
                                </div>
                                {waitlistError && (
                                    <p className="text-red-600 text-sm flex items-center gap-1">
                                        <AlertTriangle size={14} /> {waitlistError}
                                    </p>
                                )}
                                <button
                                    type="submit"
                                    disabled={waitlistLoading}
                                    className="modal-btn-primary w-full p-3 flex items-center justify-center gap-2"
                                >
                                    {waitlistLoading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                                    {waitlistLoading ? t('landing.joining') : t('landing.joinList')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== SUCCESS BANNER ===== */}
            {showDonatedBanner && (
                <div
                    style={{
                        position: 'fixed',
                        top: '1.25rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 300,
                        background: '#6f0b1d',
                        border: '1px solid rgba(212, 31, 61, 0.45)',
                        borderRadius: "0px",
                        padding: '0.75rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        color: '#e8a5ad',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <CheckCircle size={18} />
                    {t('landing.donatedBanner')}
                    <button
                        onClick={() => setShowDonatedBanner(false)}
                        style={{ marginLeft: '0.5rem', opacity: 0.7, cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Donation Modal */}
            {showDonationModal && (
                <DonationModal onClose={() => setShowDonationModal(false)} />
            )}

            {/* Login Modal */}
            {showLoginModal && (
                <div className="modal-backdrop">
                    <div className="modal-panel">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">{t('landing.logIn')}</h2>
                            <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-white transition">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.emailLabel')}</label>
                                <input
                                    type="email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    className="w-full p-3"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.passwordLabel')}</label>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="w-full p-3"
                                    required
                                />
                            </div>
                            {loginError && (
                                <div className="flex flex-wrap items-center justify-between gap-2 text-red-500 text-sm">
                                    <p className="flex min-w-0 flex-1 items-start gap-1">
                                        <AlertTriangle className="mt-0.5 shrink-0" size={14} /> {loginError}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleLogin}
                                        disabled={loginLoading}
                                        className="shrink-0 rounded border border-red-500/50 px-3 py-1 font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {t('landing.retry')}
                                    </button>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loginLoading}
                                className="modal-btn-primary w-full p-3 flex items-center justify-center gap-2"
                            >
                                {loginLoading && <Loader2 className="animate-spin" size={20} />}
                                {loginLoading ? t('landing.loggingIn') : t('landing.logIn')}
                            </button>
                        </form>
                        <p className="text-center text-gray-500 mt-4 text-sm">
                            {t('landing.noAccountPrefix')}{' '}
                            <button 
                                onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
                                className="text-red-500 hover:underline"
                            >
                                {t('landing.register')}
                            </button>
                        </p>
                    </div>
                </div>
            )}

            {/* Register Modal */}
            {showRegisterModal && (
                <div className="modal-backdrop">
                    <div className="modal-panel">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">{t('landing.createAccount')}</h2>
                            <button onClick={() => { setShowRegisterModal(false); setregisterSuccess(false); setWaitlistError(''); setRegisterError(''); }} className="text-gray-400 hover:text-white transition">
                                <X size={24} />
                            </button>
                        </div>

                        {registerSuccess ? (
                            <div className="text-center py-8">
                                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                                {hasInviteCode ? (
                                    <>
                                        <h3 className="text-xl font-semibold mb-2 text-white">{t('landing.checkEmailTitle')}</h3>
                                        <p className="text-gray-300 mb-4">
                                            {t('landing.sentLinkTo')} <span className="text-red-500">{registerData.email}</span>
                                        </p>
                                        <p className="text-green-400 text-sm">
                                            <Sparkles size={16} className="inline mr-1" />
                                            {t('landing.inviteApplied')}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-semibold mb-2 text-white">{t('landing.onTheList')}</h3>
                                        <p className="text-gray-300">
                                            We'll notify <span className="text-red-500">{waitlistEmail}</span> {t('landing.notifySpots')}
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={hasInviteCode ? handleRegister : handleWaitlistSignup} className="space-y-4">
                                <div className="bg-white/5 p-4 rounded-none mb-4 border border-gray-700/50">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasInviteCode}
                                            onChange={(e) => { setHasInviteCode(e.target.checked); setRegisterError(''); }}
                                            className="accent-red-800"
                                        />
                                        <span className="font-medium text-white">{t('landing.haveInviteCode')}</span>
                                    </label>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {t('landing.inviteGrant')}
                                    </p>
                                </div>

                                {hasInviteCode ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-1">
                                                <Sparkles size={14} className="text-yellow-500" /> {t('landing.inviteCodeLabel')}
                                            </label>
                                            <input
                                                type="text"
                                                value={registerData.inviteCode}
                                                onChange={(e) => setregisterData({...registerData, inviteCode: e.target.value.toUpperCase()})}
                                                className="w-full p-3 uppercase tracking-wider"
                                                style={{ borderColor: 'rgba(202,138,4,0.5)' }}
                                                placeholder={t("landing.inviteCodeLabel").slice(0,4) + "-XXXX"}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.usernameLabel')}</label>
                                            <input
                                                type="text"
                                                value={registerData.username}
                                                onChange={(e) => setregisterData({...registerData, username: e.target.value})}
                                                className="w-full p-3"
                                                placeholder={t('landing.usernamePlaceholder')}
                                                minLength={3}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.emailLabel')}</label>
                                            <input
                                                type="email"
                                                value={registerData.email}
                                                onChange={(e) => setregisterData({...registerData, email: e.target.value})}
                                                className="w-full p-3"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.passwordLabel')}</label>
                                            <input
                                                type="password"
                                                value={registerData.password}
                                                onChange={(e) => setregisterData({...registerData, password: e.target.value})}
                                                className="w-full p-3"
                                                placeholder={t('landing.passwordPlaceholder')}
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.confirmPassword')}</label>
                                            <input
                                                type="password"
                                                value={registerData.confirmPassword}
                                                onChange={(e) => setregisterData({...registerData, confirmPassword: e.target.value})}
                                                className="w-full p-3"
                                                required
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-300">{t('landing.emailLabel')}</label>
                                            <input
                                                type="email"
                                                value={waitlistEmail}
                                                onChange={(e) => setWaitlistEmail(e.target.value)}
                                                className="w-full p-3"
                                                placeholder={t('landing.yourEmail')}
                                                required
                                            />
                                        </div>
                                        <p className="text-gray-500 text-xs">
                                            {t('landing.notifyNoAccount')}
                                        </p>
                                    </>
                                )}

                                {(registerError || waitlistError) && (
                                    <p className="text-red-500 text-sm flex items-center gap-1">
                                        <AlertTriangle size={14} /> {registerError || waitlistError}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={registerLoading || waitlistLoading}
                                    className="modal-btn-primary w-full p-3 flex items-center justify-center gap-2"
                                >
                                    {(registerLoading || waitlistLoading) && <Loader2 className="animate-spin" size={20} />}
                                    {registerLoading ? t('landing.creatingAccount') : waitlistLoading ? t('landing.joining') : hasInviteCode ? t('landing.register') : t('landing.joinWaitlist')}
                                </button>
                            </form>
                        )}
                        
                        <p className="text-center text-gray-500 mt-4 text-sm">
                            {t('landing.hasAccountPrefix')}{' '}
                            <button 
                                onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
                                className="text-red-500 hover:underline"
                            >
                                {t('landing.logIn')}
                            </button>
                        </p>
                    </div>
                </div>
            )}

            {/* About Modal */}
            {showAboutModal && (
                <div className="modal-backdrop">
                    <div className="modal-panel modal-panel-wide">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">{t('landing.aboutTitle')}</h2>
                            <button onClick={() => setShowAboutModal(false)} className="text-gray-400 hover:text-white transition">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="max-w-none">
                            <p className="text-gray-300 mb-5 leading-relaxed">
                                {t('landing.aboutP1')}
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mt-6 mb-3">{t('landing.whatWeOffer')}</h3>
                            <ul className="text-gray-300 space-y-2 list-disc list-inside mb-4">
                                <li>{t('landing.offer1')}</li>
                                <li>{t('landing.offer2')}</li>
                                <li>{t('landing.offer3')}</li>
                                <li>{t('landing.offer4')}</li>
                                <li>{t('landing.offer5')}</li>
                            </ul>
                            
                            <h3 className="text-xl font-semibold text-white mt-6 mb-3">{t('landing.earlyAccessTitle')}</h3>
                            <p className="text-gray-300 mb-4 leading-relaxed">
                                {t('landing.earlyAccessP')}
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mt-6 mb-3">{t('landing.guestAccessTitle')}</h3>
                            <p className="text-gray-300 leading-relaxed">
                                {t('landing.guestAccessP')}
                            </p>
                        </div>
                        
                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => { setShowAboutModal(false); setShowRegisterModal(true); }}
                                className="modal-btn-primary flex-1 p-3"
                            >
                                {t('landing.registerNow')}
                            </button>
                            <button
                                onClick={() => setShowAboutModal(false)}
                                className="modal-btn-ghost px-6 py-3"
                            >
                                {t('landing.closeBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="max-w-6xl mx-auto px-4 text-center text-sm" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    <p>© 2026 Marxist.info — Advancing Revolutionary Theory</p>
                    <p className="mt-2">
                        {t('landing.madeOwned')}{' '}
                        <a
                            href="https://JinbuJYG.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-500 transition hover:text-red-400"
                        >
                            JinbuJYG.com
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
