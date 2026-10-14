/**
 * Shared helpers for the digital library full-text search.
 *
 * normalizeSearchQuery() mirrors private.library_normalize_text() in
 * supabase/migrations/20260914120000_library_text_search.sql — keep the two
 * in sync so what the user types matches how the server normalized the
 * books. renderSnippetHtml() turns an RPC row (snippet + match_offset +
 * match_len) into safe HTML with the hit wrapped in <mark>, and
 * buildMarkCandidates() gives mark.js the punctuation variants it needs to
 * find the phrase inside the rendered reader DOM, where typographic quotes
 * and dashes survive in their original form.
 */

const CURLY_SINGLE = /[\u2018\u2019\u201A\u2039\u203A]/g;
const CURLY_DOUBLE = /[\u201C\u201D\u201E\u00AB\u00BB]/g;
const TYPOGRAPHIC_DASHES = /[\u2010\u2011\u2012\u2013\u2014\u2015]/g;
const EXOTIC_SPACES = /[\u00A0\u2007\u2009\u200A\u202F\u200B\uFEFF]/g;

export const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

/* Query-side twin of the SQL normalizer: strip markdown syntax, fold
   typographic punctuation onto ASCII, collapse whitespace. */
export const normalizeSearchQuery = (raw) =>
    String(raw ?? '')
        .slice(0, 300)
        .replace(/<[^>]*>/g, ' ')
        .replace(/^[ \t]*([-*_]+[ \t]*){3,}$/gm, ' ')
        .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '')
        .replace(/^[ \t]*>+ ?/gm, '')
        .replace(/^[ \t]*([-*+]|\d{1,3}\.)[ \t]+/gm, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
        .replace(/\[\^[^\]]*\]/g, '')
        .replace(/[*_~`]+/g, '')
        .replace(/\u2026/g, '...')
        .replace(CURLY_SINGLE, "'")
        .replace(CURLY_DOUBLE, '"')
        .replace(TYPOGRAPHIC_DASHES, '-')
        .replace(/\|/g, ' ')
        .replace(EXOTIC_SPACES, ' ')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Build the highlighted snippet markup for one search hit. Offsets refer to
 * the raw snippet text, so every dynamic part is escaped after slicing —
 * the only injected tag is our own <mark>. The server sends
 * snippet_cut_start/snippet_cut_end telling whether the ~260-char window
 * actually trimmed the section text, which is what the edge ellipses show.
 */
export const renderSnippetHtml = (snippet, matchOffset, matchLen, cutStart, cutEnd) => {
    const text = String(snippet ?? '');
    const total = text.length;
    const length = Number.isFinite(Number(matchLen)) ? Math.max(0, Number(matchLen)) : 0;
    const rawOffset = Number(matchOffset);
    const offset = Number.isFinite(rawOffset) ? rawOffset : 0;

    // No usable mark (empty range or out-of-bounds offset): plain escaped text.
    if (length <= 0 || offset < 0 || offset >= total) {
        return escapeHtml(text);
    }
    const end = Math.min(total, offset + length);

    const prefix = cutStart ? '\u2026' : '';
    const suffix = cutEnd ? '\u2026' : '';
    return `${prefix}${escapeHtml(text.slice(0, offset))}<mark class="lib-hit">${escapeHtml(
        text.slice(offset, end)
    )}</mark>${escapeHtml(text.slice(end))}${suffix}`;
};

/* Straight -> typographic heuristics: apostrophes between word characters,
   quotes opening after a boundary and closing before one. (No lookbehind —
   it is a parse-time syntax error on older Safari.) */
const toTypographic = (text) =>
    text
        .replace(/(\w)'(\w)/g, '$1\u2019$2')
        .replace(/(^|\s)"(?=\S)/g, '$1\u201C')
        .replace(/(\S)"(?=$|\s)/g, '$1\u201D')
        .replace(/ - /g, ' \u2014 ');

/**
 * Punctuation variants of the query for marking the rendered DOM, where the
 * original typographic characters are intact. Returns a de-duplicated list
 * ordered most-likely-first; mark.js tries them in order.
 */
export const buildMarkCandidates = (query) => {
    const normalized = normalizeSearchQuery(query);
    if (!normalized) return [];
    const candidates = [normalized, toTypographic(normalized)];
    return [...new Set(candidates.filter(Boolean))];
};
