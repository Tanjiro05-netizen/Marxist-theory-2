import React from 'react';
import { Calendar, User, Clock, Globe, Tag, BookOpen, Languages } from 'lucide-react';

const LanguageNames = {
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
    ru: 'Русский',
    zh: '中文',
    pt: 'Português',
    it: 'Italiano',
};

const TextMetadata = ({ 
    metadata, 
    currentLanguage, 
    availableLanguages, 
    onLanguageChange 
}) => {
    if (!metadata) return null;

    const {
        title,
        authors = [],
        year,
        firstPublished,
        wordCount,
        readingTimeMinutes,
        category,
        tags = [],
        source,
        translator,
        transcriber,
    } = metadata;

    return (
        <div className="bg-[#10131b] from-gray-900 to-gray-800 rounded-none p-6 mb-6 border border-gray-700/50">
            {/* Language Switcher */}
            {availableLanguages.length > 1 && (
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-700/50">
                    <Languages size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-400 mr-2">Language:</span>
                    <div className="flex gap-2">
                        {availableLanguages.map((lang) => (
                            <button
                                key={lang}
                                onClick={() => onLanguageChange(lang)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-all
                                    ${currentLanguage === lang
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                {LanguageNames[lang] || lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                {title}
            </h1>

            {/* Authors */}
            {authors.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                    <User size={18} className="text-red-500" />
                    <span className="text-lg text-gray-300">
                        {authors.join(', ')}
                    </span>
                </div>
            )}

            {/* Meta info row */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                {(year || firstPublished) && (
                    <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{year || firstPublished}</span>
                    </div>
                )}
                {wordCount && (
                    <div className="flex items-center gap-1">
                        <BookOpen size={14} />
                        <span>{wordCount.toLocaleString()} words</span>
                    </div>
                )}
                {readingTimeMinutes && (
                    <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{readingTimeMinutes} min read</span>
                    </div>
                )}
                {category && (
                    <div className="flex items-center gap-1">
                        <Globe size={14} />
                        <span>{category}</span>
                    </div>
                )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-700/50 rounded-full text-xs text-gray-300"
                        >
                            <Tag size={12} />
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Credits */}
            {(translator || transcriber || source) && (
                <div className="text-xs text-gray-500 pt-3 border-t border-gray-700/50 space-y-1">
                    {translator && <p>Translated by: {translator}</p>}
                    {transcriber && <p>Transcribed by: {transcriber}</p>}
                    {source && <p>Source: {source}</p>}
                </div>
            )}
        </div>
    );
};

export default TextMetadata;
