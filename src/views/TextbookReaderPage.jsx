import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { useReaderChrome } from '../components/EditorialReader/readerChrome';
import * as chrome from '../components/EditorialReader/ReaderChrome.css.ts';
import * as s from './TextbookReaderPage.css.ts';
import 'katex/dist/katex.min.css';

const TextbookReaderPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [textbook, setTextbook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === 'undefined') return 1;
    const fromUrl = Number(new URLSearchParams(window.location.search).get('page'));
    return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : 1;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toolbarHidden } = useReaderChrome();

  useEffect(() => {
    fetchTextbook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTextbook = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stem_textbooks')
        .select('*, stem_subjects(name, color)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTextbook(data);
    } catch (error) {
      console.error('Error fetching textbook:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* Keep the page number in the URL so a reload or shared link reopens the
     textbook where the reader left it. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const current = params.get('page');
    if (currentPage > 1) {
      if (current !== String(currentPage)) {
        params.set('page', String(currentPage));
        window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params.toString()}`);
      }
    } else if (current) {
      params.delete('page');
      const qs = params.toString();
      window.history.replaceState(window.history.state, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    }
  }, [currentPage]);

  const clampPage = (page) => Math.min(Math.max(1, page), textbook?.page_count || Infinity);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className={s.page}>
        <div className={s.loadingWrap}>{t('science.loadingTextbook')}</div>
      </div>
    );
  }

  if (!textbook) {
    return (
      <div className={s.page}>
        <div className={s.notFoundWrap}>
          <p className={s.notFoundText}>{t('science.textbookNotFound')}</p>
          <Link href="/science-tech" className={s.notFoundLink}>
            ← {t('science.backToScience')}
          </Link>
        </div>
      </div>
    );
  }

  const pageCount = textbook.page_count;

  return (
    <div className={s.page}>

      {/* Reader toolbar — the only sticky chrome on this surface. The page
          controls are available on phones too: flipping pages is the primary
          action in a paginated PDF. */}
      <div className={`${s.toolbar}${toolbarHidden ? ` ${chrome.toolbarHidden}` : ''}`}>
        <div className={s.titleGroup}>
          <Link
            href="/science-tech"
            className={s.backBtn}
            aria-label={t('science.backToScience')}
          >
            <ArrowLeft size={16} />
          </Link>
          <div className={s.titleBlock}>
            <h1 className={s.title}>{textbook.title}</h1>
            {textbook.author && <p className={s.author}>{textbook.author}</p>}
          </div>
        </div>

        <div className={s.controls}>
          {pageCount && (
            <div className={s.pageGroup}>
              <button
                onClick={() => setCurrentPage(p => clampPage(p - 1))}
                className={s.ctrlBtn}
                aria-label={t('science.previousPage')}
                disabled={currentPage <= 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span className={s.pageValue}>
                {t('science.pageProgress', { current: currentPage, total: pageCount })}
              </span>
              <button
                onClick={() => setCurrentPage(p => clampPage(p + 1))}
                className={s.ctrlBtn}
                aria-label={t('science.nextPage')}
                disabled={currentPage >= pageCount}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <button onClick={handleZoomOut} className={s.ctrlBtn} aria-label={t('science.zoomOut')} title={t('science.zoomOut')}>
            <ZoomOut size={16} />
          </button>
          <span className={s.zoomValue}>{zoom}%</span>
          <button onClick={handleZoomIn} className={s.ctrlBtn} aria-label={t('science.zoomIn')} title={t('science.zoomIn')}>
            <ZoomIn size={16} />
          </button>
          <button onClick={toggleFullscreen} className={s.ctrlBtn} aria-label={t('science.toggleFullscreen')} title={t('science.toggleFullscreen')}>
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          {textbook.file_url && (
            <a
              href={textbook.file_url}
              download
              className={s.ctrlBtn}
              aria-label={t('science.downloadPdf')}
              title={t('science.downloadPdf')}
            >
              <Download size={16} />
            </a>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className={s.viewer}>
        <div className={s.frameMax}>
          {textbook.file_url ? (
            <div
              className={s.frame}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <iframe
                src={`${textbook.file_url}#page=${currentPage}`}
                title={textbook.title}
                className={s.pdfFrame}
              />
            </div>
          ) : (
            <div className={s.emptyWrap}>
              <p>{t('science.noTextbookPdf')}</p>
            </div>
          )}

          {textbook.description && (
            <div className={s.about}>
              <h3 className={s.aboutTitle}>{t('science.aboutTextbook')}</h3>
              <p className={s.aboutText}>{textbook.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextbookReaderPage;
