import React, { useMemo } from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { renderSnippetHtml } from '../../utils/textSearch';

/* Rows arrive from search_library_text() ordered book by book (exact hits
   first, then all-words fallback), so grouping is a single ordered pass. */
const groupRowsByBook = (rows) => {
    const groups = [];
    const byBook = new Map();
    rows.forEach((row) => {
        let group = byBook.get(row.book_id);
        if (!group) {
            group = { book: row, rows: [] };
            byBook.set(row.book_id, group);
            groups.push(group);
        }
        group.rows.push(row);
    });
    return groups;
};

const passageHref = (row, query) =>
    `/book/${row.book_id}?section=${encodeURIComponent(row.section_id)}&q=${encodeURIComponent(query)}`;

/* Crimson hit highlight for the snippet marks. Kept inline so the component
   stays self-contained on a page that mixes Tailwind utilities and theme vars. */
const HIT_CSS = `
.passages mark.lib-hit {
    background: rgba(155, 16, 34, 0.30);
    color: inherit;
    padding: 0 2px;
}
`;

/**
 * Full-text search results: one block per book with up to N passage
 * snippets, each linking into the reader at the matching section with the
 * phrase pre-highlighted (Google-Books style).
 */
const PassagesResults = ({ query, rows }) => {
    const { t } = useTranslation();
    const groups = useMemo(() => groupRowsByBook(rows || []), [rows]);

    if (!rows || rows.length === 0) return null;

    return (
        <section className="passages" data-testid="passages-results">
            <style>{HIT_CSS}</style>
            <div className="mb-1 flex flex-col gap-3">
                <div className="flex items-baseline gap-4">
                    <h2 className="m-0 shrink-0 font-display text-[24px] font-medium tracking-[0.01em] text-[color:var(--paper)]">
                        {t('library.inTheTexts')}
                    </h2>
                    <span className="shrink-0 font-[Outfit,sans-serif] text-[9px] font-medium uppercase tracking-[0.22em] text-[color:var(--paper-faint)]">
                        {t('library.passagesCount', { count: rows.length })}
                    </span>
                    <span className="hidden sm:block h-px flex-1 bg-[color:var(--line-soft)]" aria-hidden="true" />
                </div>
                <p className="m-0 font-[Outfit,sans-serif] text-[10px] uppercase tracking-[0.18em] text-[color:var(--paper-faint)]">
                    {t('library.passagesHint')}
                </p>
            </div>

            <div className="border-t border-[color:var(--line-soft)]">
                {groups.map(({ book, rows: hitRows }) => (
                    <article
                        key={book.book_id}
                        className="flex flex-col gap-2 border-b border-[color:var(--line-soft)] py-5 sm:flex-row sm:gap-6"
                        data-testid="passage-book"
                    >
                        <div className="w-full shrink-0 sm:w-[240px]">
                            <Link
                                href={passageHref(hitRows[0], query)}
                                className="font-body text-[16px] font-medium leading-snug text-[color:var(--paper)] transition-colors hover:text-[color:var(--red-bright)]"
                            >
                                {book.title}
                            </Link>
                            <p className="m-0 mt-1.5 flex flex-wrap items-center gap-x-2 font-[Outfit,sans-serif] text-[9.5px] font-medium uppercase tracking-[0.2em] text-[color:var(--paper-faint)]">
                                {book.author && <span>{book.author}</span>}
                                {book.year ? <span>· {book.year}</span> : null}
                                {book.category ? (
                                    <span className="text-[color:var(--red-bright)]">· {book.category}</span>
                                ) : null}
                            </p>
                        </div>

                        <div className="min-w-0 flex-1">
                            {hitRows.map((hit) => (
                                <Link
                                    key={`${hit.book_id}-${hit.section_id}`}
                                    href={passageHref(hit, query)}
                                    data-testid="passage-hit"
                                    className="block border border-transparent px-3 py-2.5 -mx-3 transition-colors hover:border-[color:var(--line)] hover:bg-[rgba(155,16,34,0.04)]"
                                >
                                    <p className="m-0 mb-1.5 flex items-center gap-2 font-[Outfit,sans-serif] text-[9.5px] font-medium uppercase tracking-[0.18em] text-[color:var(--paper-faint)]">
                                        <FileText size={11} className="shrink-0" />
                                        <span className="truncate">{hit.section_title || hit.section_id}</span>
                                        <span
                                            className={`shrink-0 border px-1.5 py-0.5 text-[8px] tracking-[0.14em] ${
                                                hit.is_exact
                                                    ? 'border-[rgba(155,16,34,0.45)] text-[color:var(--red-bright)]'
                                                    : 'border-[color:var(--line)] text-[color:var(--paper-faint)]'
                                            }`}
                                        >
                                            {hit.is_exact ? t('library.exactMatchBadge') : t('library.allWordsBadge')}
                                        </span>
                                    </p>
                                    <p
                                        className="m-0 font-body text-[14px] leading-relaxed text-[color:var(--paper-dim)]"
                                        dangerouslySetInnerHTML={{
                                            __html: renderSnippetHtml(
                                                hit.snippet,
                                                hit.match_offset,
                                                hit.match_len,
                                                hit.snippet_cut_start,
                                                hit.snippet_cut_end
                                            ),
                                        }}
                                    />
                                </Link>
                            ))}
                            {book.book_match_count > hitRows.length && (
                                <p className="m-0 px-3 font-[Outfit,sans-serif] text-[9.5px] uppercase tracking-[0.18em] text-[color:var(--paper-faint)]">
                                    {t('library.moreInBook', { count: book.book_match_count - hitRows.length })}
                                </p>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default PassagesResults;
