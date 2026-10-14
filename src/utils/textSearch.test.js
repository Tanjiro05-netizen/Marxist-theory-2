import {
    escapeHtml,
    normalizeSearchQuery,
    renderSnippetHtml,
    buildMarkCandidates,
} from './textSearch';

describe('normalizeSearchQuery', () => {
    test('folds typographic punctuation onto ASCII like the SQL normalizer', () => {
        expect(normalizeSearchQuery('labour’s “power” — congealed')).toBe(
            'labour\'s "power" - congealed'
        );
        expect(normalizeSearchQuery('value\u2026 price')).toBe('value... price');
        expect(normalizeSearchQuery('a\u00A0b\u200Bc  d')).toBe('a b c d');
    });

    test('strips markdown that would break phrase matching', () => {
        expect(normalizeSearchQuery('the **double** character of labour')).toBe(
            'the double character of labour'
        );
        expect(normalizeSearchQuery('[simple circulation](https://x.example) today')).toBe(
            'simple circulation today'
        );
        expect(normalizeSearchQuery('# Chapter heading text')).toBe('Chapter heading text');
        expect(normalizeSearchQuery('- a list item continues')).toBe('a list item continues');
    });

    test('is null-safe and caps length', () => {
        expect(normalizeSearchQuery(null)).toBe('');
        expect(normalizeSearchQuery(undefined)).toBe('');
        expect(normalizeSearchQuery('   ')).toBe('');
        expect(normalizeSearchQuery('x'.repeat(400)).length).toBe(300);
    });
});

describe('renderSnippetHtml', () => {
    test('wraps the exact match range, no ellipses for uncut snippets', () => {
        const snippet = 'The wealth of those societies presents itself as commodities today.';
        const offset = snippet.indexOf('commodities');
        const html = renderSnippetHtml(snippet, offset, 'commodities'.length, false, false);
        expect(html).toBe(
            'The wealth of those societies presents itself as <mark class="lib-hit">commodities</mark> today.'
        );
        expect(html).not.toContain('\u2026');
    });

    test('adds ellipses only where the server cut the window', () => {
        const snippet = 'of a much longer passage here';
        const offset = snippet.indexOf('much');
        const html = renderSnippetHtml(snippet, offset, 'much'.length, true, true);
        expect(html).toBe('\u2026of a <mark class="lib-hit">much</mark> longer passage here\u2026');
        const oneSided = renderSnippetHtml(snippet, offset, 'much'.length, false, true);
        expect(oneSided.startsWith('of')).toBe(true);
        expect(oneSided.endsWith('\u2026')).toBe(true);
    });

    test('escapes HTML so offsets cannot inject markup', () => {
        const snippet = 'safe <script>alert(1)</script> & "quotes" around';
        const offset = snippet.indexOf('& "quotes"');
        const html = renderSnippetHtml(snippet, offset, 9, false, false);
        expect(html).not.toContain('<script>');
        expect(html).toContain('&amp;');
        expect(html).toContain('&quot;');
        // Only our own mark tag may appear.
        expect(html.replace(/<\/?mark[^>]*>/g, '')).not.toContain('<');
    });

    test('degrades safely for out-of-range or empty matches', () => {
        expect(renderSnippetHtml('plain text', 0, 0)).toBe('plain text');
        expect(renderSnippetHtml('abc', 99, 5, true, true)).toBe('abc');
        expect(renderSnippetHtml('', 0, 3, true, true)).toBe('');
    });
});

describe('buildMarkCandidates', () => {
    test('returns straight and typographic variants, deduplicated', () => {
        const candidates = buildMarkCandidates('labour\'s "power" - congealed');
        expect(candidates[0]).toBe('labour\'s "power" - congealed');
        expect(candidates).toContain('labour\u2019s \u201Cpower\u201D \u2014 congealed');
        expect(new Set(candidates).size).toBe(candidates.length);
    });

    test('empty queries yield no candidates', () => {
        expect(buildMarkCandidates('')).toEqual([]);
        expect(buildMarkCandidates('  ')).toEqual([]);
    });
});

describe('escapeHtml', () => {
    test('escapes the full risky set', () => {
        expect(escapeHtml('<a href="x">&\'</a>')).toBe(
            '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;'
        );
        expect(escapeHtml(null)).toBe('');
    });
});
