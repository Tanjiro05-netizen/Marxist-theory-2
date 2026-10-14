import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import MarxPortrait from '../assets/Marx.jpg';
import hammerAndSickleImage from '../assets/hammerandsickle.png';
import DonationModal from '../components/DonationModal';
import PublicationContents from '../components/PublicationContents';
import ThemeToggle from '../components/ThemeToggle';
import useSitePresence from '../hooks/useSitePresence';
import { lockPageScroll } from '../utils/scrollLock';
import './LandingPage.css';

const portraitUrl = typeof MarxPortrait === 'string' ? MarxPortrait : MarxPortrait.src;
const emblemUrl =
  typeof hammerAndSickleImage === 'string' ? hammerAndSickleImage : hammerAndSickleImage.src;

function EditorialDialog({ title, onClose, children, wide = false }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement;
    const unlockPageScroll = lockPageScroll();
    const sheet = document.querySelector('.landing-sheet');
    const previousInert = sheet?.inert;
    if (sheet) sheet.inert = true;
    panelRef.current?.querySelector('button')?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const controls = [...(panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      ) || [])].filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      unlockPageScroll();
      if (sheet) sheet.inert = previousInert;
      document.removeEventListener('keydown', handleKey);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className={`modal-panel ${wide ? 'modal-panel-wide' : ''}`} ref={panelRef}
        role="dialog" aria-modal="true" aria-labelledby="landing-dialog-title">
        <header className="editorial-dialog-heading">
          <h2 id="landing-dialog-title">{title}</h2>
          <button type="button" className="editorial-close" onClick={onClose} aria-label="Close dialog">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, login, signUp, isAdmin } = useAuth();
  /* Landing visitors join the site-wide presence channel too, so the admin
     count covers the whole site; the badge itself renders for admins only. */
  const presence = useSitePresence(user?.id || null);
  const isAdminViewer = isAdmin();
  const [dialog, setDialog] = useState(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showDonatedBanner, setShowDonatedBanner] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '', email: '', password: '', confirmPassword: '', inviteCode: '', betaReason: '',
  });
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [hasInviteCode, setHasInviteCode] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [notifyInvites, setNotifyInvites] = useState(true);
  const [notifyBeta, setNotifyBeta] = useState(true);

  useEffect(() => {
    setShowDonatedBanner(new URLSearchParams(window.location.search).get('donated') === 'true');
  }, []);

  const closeDialog = () => {
    setDialog(null);
    setRegisterSuccess(false);
    setRegisterError('');
    setWaitlistError('');
  };
  const updateRegistration = (field, value) => setRegisterData(data => ({ ...data, [field]: value }));

  const handleLogin = async event => {
    event.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const result = await login({ email: loginEmail, password: loginPassword });
      if (result.error) setLoginError(result.error.message);
      else { setDialog(null); router.push('/home'); }
    } catch (error) {
      setLoginError(error.message || t('landing.errLoginFailed'));
    } finally { setLoginLoading(false); }
  };

  const handleRegister = async event => {
    event.preventDefault();
    setRegisterError('');
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError(t('landing.errPasswords'));
      return;
    }
    if (registerData.username.length < 3) {
      setRegisterError(t('landing.errUsernameMin'));
      return;
    }
    setRegisterLoading(true);
    try {
      if (hasInviteCode && registerData.inviteCode) {
        const { data: validation, error } = await supabase.rpc('validate_invite_code', {
          p_code: registerData.inviteCode,
        });
        if (error || !validation?.valid) {
          setRegisterError(t('landing.errInvalidInvite'));
          return;
        }
      }
      const result = await signUp({
        email: registerData.email, password: registerData.password, username: registerData.username,
        inviteCode: hasInviteCode ? registerData.inviteCode : null,
        betaReason: !hasInviteCode ? registerData.betaReason : null,
      });
      if (result.error) setRegisterError(result.error.message);
      else setRegisterSuccess(true);
    } catch (error) {
      setRegisterError(error.message || t('landing.errJoinFailed'));
    } finally { setRegisterLoading(false); }
  };

  const handleWaitlistSignup = async (event, registration = false) => {
    event.preventDefault();
    setWaitlistError('');
    setWaitlistLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('waitlist-signup', {
        body: {
          email: waitlistEmail.trim().toLowerCase(),
          notify_invite_codes: notifyInvites, notify_public_beta: notifyBeta,
        },
      });
      if (error) setWaitlistError(t('landing.errJoinFailed'));
      else if (data?.alreadyExists) setWaitlistError(t('landing.errAlreadyList'));
      else if (data?.error) setWaitlistError(data.error);
      else {
        setWaitlistSuccess(true);
        if (registration) setRegisterSuccess(true);
      }
    } catch {
      setWaitlistError(t('landing.errJoinFailed'));
    } finally { setWaitlistLoading(false); }
  };

  return (
    <div className="landing-page">
      <div className="landing-sheet">
        <header className="landing-masthead">
          <div className="landing-masthead-inner">
            <h1>Marxist<span>.</span>info</h1>
            <span className="landing-rule" aria-hidden="true"></span>
            <p className="landing-tagline">{t('landing.tagline')}</p>
          </div>
        </header>
        <nav className="landing-actions" aria-label="Main navigation">
          <Link href="/digital-library">{t('nav.library')}</Link>
          <Link href="/submit">{t('submit.submitWork')}</Link>
          <button type="button" onClick={() => setDialog('login')}>{t('landing.logIn')}</button>
          <button type="button" onClick={() => setDialog('register')}>{t('landing.register')}</button>
          <button type="button" className="landing-about-action" onClick={() => setDialog('about')}>
            {t('landing.aboutProject')}
          </button>
          <ThemeToggle className="landing-theme-toggle" />
          {isAdminViewer && presence && (
            <span
              className="landing-live-badge"
              title={`${t('nav.onlineNow')}: ${presence.total} · ${t('nav.onlineMembers')} ${presence.members} · ${t('nav.onlineGuests')} ${presence.guests}`}
            >
              <span className="landing-live-dot" aria-hidden="true"></span>
              {presence.total}
            </span>
          )}
        </nav>
        <main className="landing-main">
          <section className="landing-hero" aria-labelledby="landing-hero-title">
            <img src={emblemUrl} className="landing-hero-emblem" alt="" aria-hidden="true" />
            <div className="landing-hero-copy">
              <h2 id="landing-hero-title">{t('landing.heroNew')}</h2>
              <div className="landing-hero-ctas">
                <Link href="/home" className="landing-hero-primary">{t('landing.enterPlatform')}</Link>
                <Link href="/submit" className="landing-hero-secondary">{t('submit.submitWork')}</Link>
              </div>
            </div>
            <figure className="landing-hero-portrait">
              <img src={portraitUrl} width="1046" height="1414" alt="" loading="eager" />
            </figure>
          </section>
          <div className="landing-corners" aria-hidden="true">
            <span>Marxists.Info</span>
            <span>Theory · Education · Analysis</span>
          </div>
          <section className="landing-front" aria-labelledby="landing-contents-title">
            <div className="landing-index">
              <h2 id="landing-contents-title">Contents</h2>
              <PublicationContents user={user} onRestrictedClick={() => setDialog('login')} />
            </div>
          </section>
          <section className="landing-mailing" aria-labelledby="landing-mailing-title">
            <h2 id="landing-mailing-title">{t('landing.stayUpdatedTitle')}</h2>
            {waitlistSuccess ? <p role="status">{t('landing.onTheList')}</p> : (
              <form onSubmit={handleWaitlistSignup} className="editorial-form landing-mailing-form">
                <div className="landing-mailing-input">
                  <label htmlFor="notification-email">{t('landing.emailLabel')}</label>
                  <input id="notification-email" type="email" autoComplete="email" required value={waitlistEmail}
                    onChange={event => setWaitlistEmail(event.target.value)} />
                </div>
                <button type="submit" className="editorial-button" disabled={waitlistLoading}>
                  {waitlistLoading ? t('landing.joining') : t('landing.joinList')}
                </button>
                <div className="editorial-preferences">
                  <label><input type="checkbox" checked={notifyInvites} onChange={event => setNotifyInvites(event.target.checked)} />
                    {t('landing.notifyInvites')}</label>
                  <label><input type="checkbox" checked={notifyBeta} onChange={event => setNotifyBeta(event.target.checked)} />
                    {t('landing.notifyBeta')}</label>
                </div>
                {waitlistError && <p className="editorial-error" role="alert">{waitlistError}</p>}
              </form>
            )}
          </section>
          <section className="landing-vision" aria-labelledby="landing-vision-title">
            <h2 id="landing-vision-title">{t('landing.visionTitle')}</h2>
            <p>{t('landing.visionP1')}</p>
            <p>{t('landing.visionP2')}</p>
            <p>{t('landing.visionP3')}</p>
            <div className="landing-project-links">
              <a href="https://x.com/Leninistwarrior" target="_blank" rel="noopener noreferrer">{t('landing.twitter')}</a>
              <a href="https://JinbuJYG.com" target="_blank" rel="noopener noreferrer">JinbuJYG.com</a>
              <button type="button" className="landing-support" onClick={() => setShowDonationModal(true)}>
                <Heart size={16} aria-hidden="true" />
                {t('landing.supportProject')}
              </button>
            </div>
          </section>
        </main>
        <footer className="landing-footer">
          <p>© {new Date().getFullYear()} Marxist.info</p>
          <div className="landing-project-links">
            <a href="https://x.com/Leninistwarrior" target="_blank" rel="noopener noreferrer">@Leninistwarrior</a>
            <a href="https://JinbuJYG.com" target="_blank" rel="noopener noreferrer">JinbuJYG.com</a>
            <button type="button" onClick={() => setShowDonationModal(true)}>{t('landing.supportProject')}</button>
          </div>
        </footer>
      </div>

      {showDonatedBanner && <div className="landing-thanks" role="status">
        <span>Thank you for your support.</span>
        <button className="editorial-close" onClick={() => setShowDonatedBanner(false)} aria-label="Dismiss thank you message">
          <X size={18} aria-hidden="true" />
        </button>
      </div>}
      {showDonationModal && <DonationModal onClose={() => setShowDonationModal(false)} />}

      {dialog === 'login' && <EditorialDialog key="login" title={t('landing.logIn')} onClose={closeDialog}>
        <form onSubmit={handleLogin} className="editorial-form">
          <label htmlFor="login-email">{t('landing.emailLabel')}</label>
          <input id="login-email" type="email" autoComplete="email" required value={loginEmail}
            onChange={event => setLoginEmail(event.target.value)} />
          <label htmlFor="login-password">{t('landing.passwordLabel')}</label>
          <input id="login-password" type="password" autoComplete="current-password" required value={loginPassword}
            onChange={event => setLoginPassword(event.target.value)} />
          {loginError && <p className="editorial-error" role="alert">{loginError}</p>}
          <button type="submit" className="editorial-button" disabled={loginLoading}>
            {loginLoading ? t('landing.loggingIn') : loginError ? t('landing.retry') : t('landing.logIn')}
          </button>
        </form>
        <p className="editorial-switch">{t('landing.noAccountPrefix')}{' '}
          <button type="button" onClick={() => setDialog('register')}>{t('landing.register')}</button>
        </p>
      </EditorialDialog>}

      {dialog === 'register' && <EditorialDialog key="register" title={t('landing.createAccount')} onClose={closeDialog}>
        {registerSuccess ? <div className="editorial-success" role="status">
          <h3>{hasInviteCode ? t('landing.checkEmailTitle') : t('landing.onTheList')}</h3>
          <p>{hasInviteCode ? `${t('landing.sentLinkTo')} ${registerData.email}` : t('landing.notifyWhenOpen', { email: waitlistEmail })}</p>
          {hasInviteCode && <p>{t('landing.inviteApplied')}</p>}
        </div> : <form className="editorial-form" onSubmit={hasInviteCode ? handleRegister : event => handleWaitlistSignup(event, true)}>
          <label className="editorial-check"><input type="checkbox" checked={hasInviteCode}
            onChange={event => { setHasInviteCode(event.target.checked); setRegisterError(''); setWaitlistError(''); }} />
            {t('landing.haveInviteCode')}</label>
          {hasInviteCode ? <>
            <label htmlFor="register-invite">{t('landing.inviteCodeLabel')}</label>
            <input id="register-invite" required autoComplete="off" value={registerData.inviteCode}
              onChange={event => updateRegistration('inviteCode', event.target.value.toUpperCase())} />
            <label htmlFor="register-username">{t('landing.usernameLabel')}</label>
            <input id="register-username" required autoComplete="username" minLength={3} value={registerData.username}
              onChange={event => updateRegistration('username', event.target.value)} />
            <label htmlFor="register-email">{t('landing.emailLabel')}</label>
            <input id="register-email" required type="email" autoComplete="email" value={registerData.email}
              onChange={event => updateRegistration('email', event.target.value)} />
            <label htmlFor="register-password">{t('landing.passwordLabel')}</label>
            <input id="register-password" required type="password" minLength={6} autoComplete="new-password" value={registerData.password}
              onChange={event => updateRegistration('password', event.target.value)} />
            <label htmlFor="register-confirm">{t('landing.confirmPassword')}</label>
            <input id="register-confirm" required type="password" autoComplete="new-password" value={registerData.confirmPassword}
              onChange={event => updateRegistration('confirmPassword', event.target.value)} />
          </> : <>
            <label htmlFor="register-waitlist-email">{t('landing.emailLabel')}</label>
            <input id="register-waitlist-email" required type="email" autoComplete="email" value={waitlistEmail}
              onChange={event => setWaitlistEmail(event.target.value)} />
            <p className="editorial-note">{t('landing.notifyNoAccount')}</p>
          </>}
          {(registerError || waitlistError) && <p className="editorial-error" role="alert">{registerError || waitlistError}</p>}
          <button type="submit" className="editorial-button" disabled={registerLoading || waitlistLoading}>
            {registerLoading ? t('landing.creatingAccount') : waitlistLoading ? t('landing.joining') : hasInviteCode ? t('landing.register') : t('landing.joinWaitlist')}
          </button>
        </form>}
        <p className="editorial-switch">{t('landing.hasAccountPrefix')}{' '}
          <button type="button" onClick={() => setDialog('login')}>{t('landing.logIn')}</button>
        </p>
      </EditorialDialog>}

      {dialog === 'about' && <EditorialDialog key="about" title={t('landing.aboutTitle')} onClose={closeDialog} wide>
        <div className="editorial-about">
          <p>{t('landing.aboutP1')}</p>
          <div className="landing-project-links">
            <a href="https://x.com/Leninistwarrior" target="_blank" rel="noopener noreferrer">@Leninistwarrior</a>
            <a href="https://JinbuJYG.com" target="_blank" rel="noopener noreferrer">JinbuJYG.com</a>
          </div>
        </div>
      </EditorialDialog>}
    </div>
  );
}
