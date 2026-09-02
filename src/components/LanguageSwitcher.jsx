import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'es', label: 'Español', flag: 'ES' },
  { code: 'de', label: 'Deutsch', flag: 'DE' },
  { code: 'zh', label: '中文', flag: '中' },
  { code: 'fr', label: 'Français', flag: 'FR' },
  { code: 'it', label: 'Italiano', flag: 'IT' },
];

const bandInk = '#14161d';
const bandHairline = 'rgba(20, 22, 29, 0.2)';
const bandAccent = '#b3122e';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = LANGUAGES.find(l => l.code === i18n.language?.split('-')[0]) || LANGUAGES[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 9px',
          background: 'transparent',
          border: `1px solid ${bandHairline}`,
          borderRadius: '0px',
          color: bandInk,
          fontFamily: 'Outfit, system-ui, sans-serif',
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          cursor: 'pointer',
          transition: 'border-color 150ms ease, color 150ms ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = bandAccent;
          e.currentTarget.style.color = bandAccent;
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.borderColor = bandHairline;
            e.currentTarget.style.color = bandInk;
          }
        }}
        title={t('nav.changeLanguage')}
      >
        <Globe size={12} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.05em' }}>
          {current.flag}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '6px',
            background: '#ffffff',
            border: `1px solid ${bandHairline}`,
            borderRadius: '0px',
            padding: '5px 0',
            minWidth: '150px',
            zIndex: 9999,
            boxShadow: '0 14px 36px rgba(0, 0, 0, 0.45)',
          }}
        >
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 14px',
                background: i18n.language?.startsWith(lang.code) ? 'rgba(179, 18, 46, 0.08)' : 'transparent',
                border: 'none',
                borderRadius: '0px',
                color: i18n.language?.startsWith(lang.code) ? bandAccent : bandInk,
                fontFamily: 'Newsreader, Georgia, serif',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'color 120ms ease',
              }}
              onMouseEnter={e => {
                if (!i18n.language?.startsWith(lang.code)) e.currentTarget.style.color = bandAccent;
              }}
              onMouseLeave={e => {
                if (!i18n.language?.startsWith(lang.code)) e.currentTarget.style.color = bandInk;
              }}
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', opacity: 0.55, width: '18px' }}>
                {lang.flag}
              </span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
