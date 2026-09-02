import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import * as s from './TextbookReaderPage.css.ts';
import 'katex/dist/katex.min.css';

const TextbookReaderPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [textbook, setTextbook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchTextbook();
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

  return (
    <div className={s.page} style={{display:'flex',flexDirection:'column'}}>
      
      {/* Top Bar */}
      <div className="fixed top-16 left-0 right-0 z-10 bg-[#0b0d12]/95 backdrop-blur-sm border-b border-red-900/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Back & Title */}
            <div className="flex items-center gap-4">
              <Link href="/science-tech"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                aria-label={t('science.backToScience')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-white font-semibold text-sm md:text-base line-clamp-1">
                  {textbook.title}
                </h1>
                {textbook.author && (
                  <p className="text-gray-500 text-xs">{textbook.author}</p>
                )}
              </div>
            </div>

            {/* Center - Page Navigation */}
            {textbook.page_count && (
              <div className="hidden md:flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  aria-label={t('science.previousPage')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-gray-400 text-sm">
                  {t('science.pageProgress', { current: currentPage, total: textbook.page_count })}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(textbook.page_count, p + 1))}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  aria-label={t('science.nextPage')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Right - Controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleZoomOut}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title={t('science.zoomOut')}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-gray-500 text-xs w-12 text-center">{zoom}%</span>
              <button 
                onClick={handleZoomIn}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title={t('science.zoomIn')}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={toggleFullscreen}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title={t('science.toggleFullscreen')}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
              {textbook.file_url && (
                <a
                  href={textbook.file_url}
                  download
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title={t('science.downloadPdf')}
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 pt-32 pb-8 px-4 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {textbook.file_url ? (
            <div 
              className="bg-white rounded-none shadow-none overflow-hidden"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <iframe
                src={`${textbook.file_url}#page=${currentPage}`}
                title={textbook.title}
                className="w-full"
                style={{ height: '85vh' }}
              />
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400">{t('science.noTextbookPdf')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Textbook Info Sidebar (optional) */}
      {textbook.description && (
        <div className="fixed bottom-4 right-4 max-w-xs">
          <div className="bg-black/80 backdrop-blur-lg rounded-none p-4 border border-red-900/30">
            <h3 className="text-white font-semibold text-sm mb-2">{t('science.aboutTextbook')}</h3>
            <p className="text-gray-400 text-xs line-clamp-3">{textbook.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextbookReaderPage;
