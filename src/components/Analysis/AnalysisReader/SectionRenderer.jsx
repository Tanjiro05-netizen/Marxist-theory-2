import React, { forwardRef } from 'react';
import { MessageSquare, Bookmark, Link2 } from 'lucide-react';
import { sanitizeRichHtml } from '../../../lib/sanitize-html.js';

const SectionRenderer = forwardRef(({ 
    section, 
    isActive,
    commentCount = 0,
    isBookmarked = false,
    onCommentClick,
    onBookmarkClick,
    onCrossRefClick,
    readingMode = false,
}, ref) => {
    const { id, title, level, content } = section;

    const HeadingTag = `h${Math.min(level + 1, 6)}`;
    
    const headingSizes = {
        1: 'text-2xl md:text-3xl',
        2: 'text-xl md:text-2xl',
        3: 'text-lg md:text-xl',
        4: 'text-base md:text-lg',
        5: 'text-base',
        6: 'text-sm',
    };

    const headingSize = headingSizes[level] || headingSizes[3];

    return (
        <section
            ref={ref}
            id={`section-${id}`}
            className={`relative group py-6 border-b border-gray-800/50 last:border-b-0 transition-all duration-300
                ${isActive ? 'bg-red-900/10 -mx-4 px-4 rounded-none' : ''}
            `}
        >
            {/* Section Actions - appear on hover (analysis mode only) */}
            {!readingMode && <div className="absolute right-0 top-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onCommentClick?.(id)}
                    className="p-2 rounded-none bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    title="Comments"
                >
                    <MessageSquare size={16} />
                    {commentCount > 0 && (
                        <span className="text-xs">{commentCount}</span>
                    )}
                </button>
                <button
                    onClick={() => onBookmarkClick?.(id)}
                    className={`p-2 rounded-none transition-colors
                        ${isBookmarked 
                            ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                            : 'bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white'
                        }`}
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Section'}
                >
                    <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
                <button
                    onClick={() => onCrossRefClick?.(id)}
                    className="p-2 rounded-none bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    title="Create Cross-Reference"
                >
                    <Link2 size={16} />
                </button>
            </div>}

            {/* Section Title */}
            {title && (
                <HeadingTag 
                    className={`font-bold text-white mb-4 ${headingSize} flex items-center gap-3`}
                >
                    {!readingMode && <span className="text-red-500/50 font-mono text-sm">
                        §{id}
                    </span>}
                    {title}
                </HeadingTag>
            )}

            {/* Section Content */}
            <div 
                className="prose prose-invert prose-red max-w-none
                    prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
                    prose-strong:text-white prose-strong:font-semibold
                    prose-em:text-gray-200 prose-em:italic
                    prose-blockquote:border-l-red-500 prose-blockquote:bg-gray-800/30 
                    prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                    prose-blockquote:text-gray-300 prose-blockquote:not-italic
                    prose-ul:text-gray-300 prose-ol:text-gray-300
                    prose-li:marker:text-red-500
                    prose-a:text-red-400 prose-a:no-underline hover:prose-a:underline
                    selection:bg-red-500/30
                "
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(formatContent(content)) }}
            />

            {/* Comment indicator badge (analysis mode only) */}
            {!readingMode && commentCount > 0 && (
                <div className="absolute -left-2 top-8 w-1 h-8 bg-red-500 rounded-full" title={`${commentCount} comments`} />
            )}
        </section>
    );
});

SectionRenderer.displayName = 'SectionRenderer';

function formatContent(content) {
    if (!content) return '';
    
    // If content is already HTML, return as is
    if (content.includes('<p>') || content.includes('<div>')) {
        return content;
    }

    // Convert plain text with line breaks to paragraphs
    return content
        .split(/\n\n+/)
        .map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
        .join('');
}

export default SectionRenderer;
