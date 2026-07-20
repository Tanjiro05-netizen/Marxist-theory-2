import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'es', label: 'Espanol', flag: 'ES' },
  { code: 'de', label: 'Deutsch', flag: 'DE' },
  { code: 'zh', label: '中文', flag: '中' },
  { code: 'fr', label: 'Francais', flag: 'FR' },
  { code: 'it', label: 'Italiano', flag: 'IT' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
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
          gap: '4px',
          padding: '4px 8px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '11px',
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
        title="Change language"
      >
        <Globe size={13} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
          {current.flag}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '6px',
            background: '#111',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '4px',
            minWidth: '140px',
            zIndex: 9999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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
                padding: '7px 10px',
                background: i18n.language?.startsWith(lang.code) ? 'rgba(200,30,30,0.15)' : 'transparent',
                border: 'none',
                borderRadius: '7px',
                color: i18n.language?.startsWith(lang.code) ? '#f87171' : 'rgba(255,255,255,0.7)',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={e => {
                if (!i18n.language?.startsWith(lang.code)) e.target.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={e => {
                if (!i18n.language?.startsWith(lang.code)) e.target.style.background = 'transparent';
              }}
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', opacity: 0.6, width: '18px' }}>
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
