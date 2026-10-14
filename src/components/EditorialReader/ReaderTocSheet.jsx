import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as chrome from './ReaderChrome.css.ts';

/**
 * The chapter list as a mobile bottom sheet — the sticky rail's stand-in for
 * narrow screens, where the rail is hidden. Dialog semantics follow the same
 * pattern as the library filter sheet: Escape/overlay dismiss, body scroll
 * lock, focus lands inside on open and returns to the invoking button.
 */
const ReaderTocSheet = ({ open, onClose, items, onSelect, triggerRef }) => {
    const { t } = useTranslation();
    const sheetRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        document.body.classList.add('reader-toc-open');
        const sheet = sheetRef.current;
        const first = sheet?.querySelector('button');
        (first || sheet)?.focus?.();

        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.classList.remove('reader-toc-open');
            window.removeEventListener('keydown', onKey);
            triggerRef?.current?.focus?.();
        };
    }, [open, onClose, triggerRef]);

    if (!open) return null;

    return (
        <>
            <div className={chrome.tocOverlay} onClick={onClose} aria-hidden="true" />
            <div
                ref={sheetRef}
                className={chrome.tocSheet}
                role="dialog"
                aria-modal="true"
                aria-labelledby="reader-toc-title"
                tabIndex={-1}
            >
                <div className={chrome.tocHandle} aria-hidden="true" />
                <div className={chrome.tocHead}>
                    <h3 id="reader-toc-title" className={chrome.tocTitle}>
                        {t('book.contents', { defaultValue: 'Contents' })}
                    </h3>
                    <button
                        type="button"
                        className={chrome.tocClose}
                        onClick={onClose}
                        aria-label={t('common.close', { defaultValue: 'Close' })}
                    >
                        <X size={13} />
                    </button>
                </div>
                <div className={chrome.tocList}>
                    {items.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            className={`${chrome.tocItem}${item.active ? ` ${chrome.tocItemActive}` : ''}`}
                            style={item.depth ? { paddingLeft: 'calc(20px + 14px)' } : undefined}
                            onClick={() => { onSelect(item); onClose(); }}
                        >
                            {item.label}
                        </button>
                    ))}
                    {items.length === 0 && (
                        <div className={chrome.tocEmpty}>
                            {t('book.noToc', { defaultValue: 'No Table of Contents available.' })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ReaderTocSheet;
