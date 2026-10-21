/**
 * pdf.js text reconstruction — the fallback ingestion path for books where
 * only a PDF exists. Takes the raw `getTextContent()` item arrays (one per
 * page, produced by the admin panel) and rebuilds paragraphed markdown
 * sections with heading detection. Pure functions, Node-testable.
 *
 * Quality is inherently best-effort (two-column layouts, footnotes, scans);
 * the admin section editor exists to cure whatever this gets wrong.
 */

import { escapeMarkdownLineStarts } from './textEdition';

const HEADING_PATTERNS = [
    { re: /^(chapter\s+(?:[ivxlc]+|\d+).*)$/i, level: 1 },
    { re: /^(part\s+(?:[ivxlc]+|\d+).*)$/i, level: 1 },
    { re: /^(preface|foreword|introduction|afterword|appendix|conclusion|epilogue|prologue)\b.*$/i, level: 1 },
    { re: /^(section\s+(?:[ivxlc]+|\d+).*)$/i, level: 2 },
    { re: /^([ivxlc]{1,7})\.?\s*$/i, level: 1 },
];

const median = (values) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
};

const itemY = (item) => item.transform?.[5] ?? 0;
const itemX = (item) => item.transform?.[4] ?? 0;
const itemHeight = (item) => Math.abs(item.transform?.[3] ?? item.height ?? 10);

/**
 * Cluster one page's text items into visual lines. Items are grouped by
 * y-proximity (tolerance scales with font height), then ordered left to right.
 */
export const groupItemsIntoLines = (items) => {
    const valid = (items || []).filter((it) => typeof it.str === 'string' && it.str.trim() !== '');
    if (!valid.length) return [];

    const sorted = [...valid].sort((a, b) => itemY(b) - itemY(a) || itemX(a) - itemX(b));
    const lines = [];

    for (const item of sorted) {
        const y = itemY(item);
        const h = itemHeight(item);
        const line = lines.find((l) => Math.abs(l.y - y) <= Math.max(2, h * 0.5));
        if (line) {
            line.items.push(item);
        } else {
            lines.push({ y, height: h, items: [item] });
        }
    }

    return lines.map((line) => {
        const ordered = [...line.items].sort((a, b) => itemX(a) - itemX(b));
        let text = '';
        let prev = null;
        for (const item of ordered) {
            if (prev) {
                const gap = itemX(item) - (itemX(prev) + (prev.width || 0));
                if (gap > itemHeight(item) * 0.3 && !/\s$/.test(text) && !/^\s/.test(item.str)) {
                    text += ' ';
                }
            }
            text += item.str;
            prev = item;
        }
        return {
            text: text.replace(/\s+/g, ' ').trim(),
            y: line.y,
            height: median(ordered.map(itemHeight)),
            x: Math.min(...ordered.map(itemX)),
            width: Math.max(...ordered.map((it) => itemX(it) + (it.width || 0))) - Math.min(...ordered.map(itemX)),
        };
    }).filter((line) => line.text.length > 0);
};

const isCapsHeading = (text) => {
    const letters = text.replace(/[^A-Za-z]/g, '');
    if (letters.length < 3 || text.length > 48) return false;
    const caps = letters.replace(/[^A-Z]/g, '');
    return caps.length / letters.length >= 0.9 && !/[.!?]$/.test(text);
};

/**
 * Heading detection for a reconstructed line: structural patterns first, then
 * ALL-CAPS short lines, then notable font-size outliers.
 */
export const detectHeading = (line, bodyHeight) => {
    const text = line.text.trim();
    if (!text || text.length > 90) return null;

    for (const { re, level } of HEADING_PATTERNS) {
        const match = re.exec(text);
        if (match) return { title: match[1].trim(), level };
    }
    if (isCapsHeading(text)) return { title: text, level: 2 };
    if (bodyHeight > 0 && line.height >= bodyHeight * 1.18 && text.length <= 64 && !/[.,;:]$/.test(text)) {
        return { title: text, level: 2 };
    }
    return null;
};

/** Join hyphen-broken line endings: "capit-" + "alisation" → "capitalisation". */
const dehyphenate = (a, b) => {
    if (/[A-Za-zÀ-ÿ]-$/.test(a) && /^[a-zà-ÿ]/.test(b)) return a.slice(0, -1) + b;
    return `${a} ${b}`;
};

/**
 * Merge visual lines into paragraphs. A break happens on a vertical gap larger
 * than ~1.4 line heights, or after a short sentence-terminal line. A heading
 * always starts a new paragraph (and section, later).
 */
export const linesToParagraphs = (lines) => {
    if (!lines.length) return [];

    const bodyHeight = median(lines.map((l) => l.height));
    const paragraphs = [];
    let current = '';
    let prevLine = null;

    const flush = () => {
        const trimmed = current.trim();
        if (trimmed) paragraphs.push(trimmed);
        current = '';
    };

    for (const line of lines) {
        const heading = detectHeading(line, bodyHeight);
        const gap = prevLine ? prevLine.y - line.y : Infinity;
        const shortTerminal = prevLine
            ? /[.!?:]$/.test(prevLine.text) && prevLine.width < (bodyHeight * 38)
            : false;

        if (heading || (prevLine && (gap > bodyHeight * 1.4 || shortTerminal))) flush();

        if (heading) {
            current = `## ${heading.title}`;
        } else if (current && !current.startsWith('## ')) {
            current = dehyphenate(current, line.text);
        } else if (current) {
            current += `\n${line.text}`;
        } else {
            current = line.text;
        }
        prevLine = line;
    }
    flush();

    return paragraphs;
};

/**
 * Full pipeline over per-page item arrays. Returns sections in the
 * text_edition shape plus stats the admin UI uses for the scan warning.
 */
export const reconstructFromPdfPages = (pages, idFactory) => {
    let n = 0;
    const nextId = () => {
        n += 1;
        return idFactory ? idFactory(n) : `s${n}`;
    };

    const allLines = [];
    let charCount = 0;
    let headingCount = 0;

    (pages || []).forEach((items, pageIndex) => {
        const lines = groupItemsIntoLines(items);
        charCount += lines.reduce((sum, l) => sum + l.text.length, 0);
        // Page breaks are always paragraph breaks: mark via an injected gap.
        if (pageIndex > 0 && lines.length) {
            lines[0].pageBreakBefore = true;
        }
        allLines.push(...lines);
    });

    // Promote pageBreakBefore into the gap the paragrapher understands by
    // splitting the line list into runs at page boundaries.
    const runs = [];
    let run = [];
    for (const line of allLines) {
        if (line.pageBreakBefore && run.length) {
            runs.push(run);
            run = [];
        }
        run.push(line);
    }
    if (run.length) runs.push(run);

    const sections = [];
    let current = null;
    const preamble = [];

    for (const lines of runs) {
        for (const paragraph of linesToParagraphs(lines)) {
            const heading = /^## (.+)$/.exec(paragraph);
            if (heading) {
                if (current) sections.push(current);
                headingCount += 1;
                current = { id: nextId(), title: heading[1], level: 1, md: '' };
            } else if (current) {
                current.md += (current.md ? '\n\n' : '') + escapeMarkdownLineStarts(paragraph);
            } else {
                preamble.push(escapeMarkdownLineStarts(paragraph));
            }
        }
    }
    if (current) sections.push(current);

    const frontMatter = preamble.join('\n\n').trim();
    if (frontMatter) {
        sections.unshift({ id: nextId(), title: 'Front matter', level: 1, md: frontMatter });
    }

    const pageCount = (pages || []).length;
    return {
        sections: sections
            .map((sec) => ({ ...sec, md: sec.md.trim() }))
            .filter((sec) => sec.md.length > 0 || sec.title !== 'Front matter'),
        stats: {
            pages: pageCount,
            chars: charCount,
            headings: headingCount,
            likelyScanned: isLikelyScanned(charCount, pageCount),
        },
    };
};

/** Scans carry almost no text layer: below ~100 chars/page it is not worth showing. */
export const isLikelyScanned = (totalChars, pageCount) =>
    pageCount > 0 && totalChars / pageCount < 100;
