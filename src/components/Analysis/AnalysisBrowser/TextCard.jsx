import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, User, Clock, Globe, Tag, Languages, ArrowRight, Trash2 } from 'lucide-react';

const LanguageFlags = {
    en: '🇬🇧',
    de: '🇩🇪',
    fr: '🇫🇷',
    es: '🇪🇸',
    ru: '🇷🇺',
    zh: '🇨🇳',
    pt: '🇵🇹',
    it: '🇮🇹',
};

const TextCard = ({ text, variant = 'grid', isAdmin = false, onDelete }) => {
    const router = useRouter();
    
    const metadata = text.metadata?.[text.primary_language] || text.metadata?.en || text.metadata || {};
    const {
        title = 'Untitled',
        authors = [],
        year,
        wordCount,
        readingTimeMinutes,
        category,
    } = metadata;

    const handleClick = () => {
        router.push(`/analysis/text/${text.slug}`);
    };

    if (variant === 'list') {
        return (
            <div
                onClick={handleClick}
                className="bg-gray-900/50 hover:bg-gray-900/80 border border-gray-800 hover:border-red-500/30 rounded-xl p-4 cursor-pointer transition-all duration-200 group"
            >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                            {title}
                        </h3>
                        {authors.length > 0 && (
                            <p className="text-gray-400 text-sm mt-1">
                                {authors.join(', ')}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {year && (
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {year}
                            </span>
                        )}
                        {readingTimeMinutes && (
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {readingTimeMinutes} min
                            </span>
                        )}
                        {text.available_languages?.length > 1 && (
                            <span className="flex items-center gap-1">
                                <Languages size={14} />
                                {text.available_languages.map(l => LanguageFlags[l] || l).join(' ')}
                            </span>
                        )}
                        <ArrowRight size={18} className="text-gray-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                        {isAdmin && onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(text.id);
                                }}
                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                title="Delete text"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Grid variant (default)
    return (
        <div
            onClick={handleClick}
            className="bg-gray-900/50 hover:bg-gray-900/80 border border-gray-800 hover:border-red-500/30 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group flex flex-col"
        >
            {/* Card Header */}
            <div className="p-5 flex-1">
                {/* Category & Languages */}
                <div className="flex items-center justify-between mb-3">
                    {text.category && (
                        <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                            {text.category}
                        </span>
                    )}
                    {text.available_languages?.length > 1 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            {text.available_languages.map(lang => (
                                <span key={lang} title={lang}>
                                    {LanguageFlags[lang] || lang}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-2 mb-2">
                    {title}
                </h3>

                {/* Authors */}
                {authors.length > 0 && (
                    <p className="text-gray-400 text-sm flex items-center gap-1 mb-3">
                        <User size={14} />
                        {authors.slice(0, 2).join(', ')}
                        {authors.length > 2 && ` +${authors.length - 2}`}
                    </p>
                )}

                {/* Tags */}
                {text.tags && text.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {text.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded"
                            >
                                {tag}
                            </span>
                        ))}
                        {text.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                                +{text.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Card Footer */}
            <div className="px-5 py-3 bg-gray-800/30 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                    {year && (
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {year}
                        </span>
                    )}
                    {wordCount && (
                        <span>{wordCount.toLocaleString()} words</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {readingTimeMinutes && (
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {readingTimeMinutes} min
                        </span>
                    )}
                    {isAdmin && onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(text.id);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete text"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TextCard;
