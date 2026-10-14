import JSZip from 'jszip';
import { buildEdition } from './textEdition.js';

/**
 * Extract a text edition from an EPUB buffer so EPUB-only library books can
 * be indexed by the full-text search (the reader cascade is untouched — only
 * `text_edition` is filled in). The approach is deliberately dependency-free
 * beyond jszip: follow the OPF spine, convert each XHTML document to plain
 * paragraphs, and title sections from their first heading.
 *
 * Everything here runs in Node (scripts/ingest-epub-texts.mjs) and in tests.
 */

const NAMED_ENTITIES = [
    [/&nbsp;/gi, ' '],
    [/&lt;/gi, '<'],
    [/&gt;/gi, '>'],
    [/&quot;/gi, '"'],
    [/&apos;/gi, "'"],
    [/&mdash;/gi, '\u2014'],
    [/&ndash;/gi, '\u2013'],
    [/&hellip;/gi, '\u2026'],
    [/&rsquo;/gi, '\u2019'],
    [/&lsquo;/gi, '\u2018'],
    [/&ldquo;/gi, '\u201C'],
    [/&rdquo;/gi, '\u201D'],
    [/&amp;/gi, '&'], // last, so "&amp;lt;" stays "&lt;"
];

const decodeNumericEntities = (str) =>
    str
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
            try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return ''; }
        })
        .replace(/&#(\d+);/g, (_, dec) => {
            try { return String.fromCodePoint(parseInt(dec, 10)); } catch { return ''; }
        });

const decodeEntities = (str) =>
    NAMED_ENTITIES.reduce(
        (out, [pattern, replacement]) => out.replace(pattern, replacement),
        decodeNumericEntities(str)
    );

/* Extract one attribute from a tag chunk, tolerating attribute order. */
const attr = (tag, name) => {
    const match = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`).exec(tag);
    return match ? match[1] : null;
};

const resolveHref = (opfPath, href) => {
    try {
        return decodeURIComponent(new URL(href, `http://x/${opfPath}`).pathname.slice(1));
    } catch {
        return href;
    }
};

/* XHTML → { title, paragraphs }. Headings become bold markdown lines so the
   reader keeps visual structure without any HTML in the stored edition. */
export const htmlToSectionBody = (html) => {
    const body = String(html || '')
        .replace(/<\?xml[^>]*\?>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<head[\s>][\s\S]*?<\/head>/gi, ' ')
        .replace(/<script[\s>][\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s>][\s\S]*?<\/style>/gi, ' ');

    const headingTags = [];
    const withHeadings = body.replace(
        /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi,
        (_all, level, inner) => {
            const text = decodeEntities(inner.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
            if (text) headingTags.push(Number(level));
            return `\n\n@@H@@${text}\n\n`;
        }
    );

    const text = decodeEntities(
        withHeadings
            .replace(/<\/(p|div|section|article|li|tr|blockquote)>/gi, '\n\n')
            .replace(/<br\s*\/?>/gi, '\n\n')
            // Inline tags vanish without a space so "para<em>graph</em>." stays
            // joined; block boundaries already got their newlines above.
            .replace(/<[^>]*>/g, '')
    );

    const lines = text
        .split(/\n{2,}/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    const paragraphs = [];
    let title = null;
    for (const line of lines) {
        if (line.startsWith('@@H@@')) {
            const headingText = line.slice(5).trim();
            if (!headingText) continue;
            if (title === null) title = headingText;
            // Markdown heading level mirrors the XHTML one (capped at 3).
            const level = Math.min(headingTags[paragraphs.filter((p) => p.startsWith('#')).length] || 1, 3);
            paragraphs.push(`${'#'.repeat(level)} ${headingText}`);
        } else {
            paragraphs.push(line);
        }
    }
    return { title, paragraphs };
};

/**
 * Parse an EPUB buffer into a text edition. Returns
 * { title, edition } — edition has the shape stored in
 * digital_library_books.text_edition (buildEdition output).
 */
export const parseEpubBuffer = async (buffer) => {
    let zip;
    try {
        zip = await JSZip.loadAsync(buffer);
    } catch {
        throw new Error('Not an EPUB: file is not a valid zip archive');
    }

    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) throw new Error('Not an EPUB: missing META-INF/container.xml');
    const containerXml = await containerFile.async('string');
    const opfPathMatch = /<rootfile\b[^>]*full-path\s*=\s*"([^"]*)"/.exec(containerXml) ||
        /<rootfile\b[^>]*full-path\s*=\s*'([^']*)'/.exec(containerXml);
    if (!opfPathMatch) throw new Error('Not an EPUB: no rootfile in container.xml');
    const opfPath = opfPathMatch[1];
    const opfFile = zip.file(opfPath) || zip.file(opfPath.replace(/^\/+/, ''));
    if (!opfFile) throw new Error(`EPUB is missing its OPF (${opfPath})`);
    const opfXml = await opfFile.async('string');

    const bookTitleMatch = /<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i.exec(opfXml);
    const bookTitle = bookTitleMatch
        ? decodeEntities(bookTitleMatch[1].replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim()
        : null;

    // manifest id → { href, mediaType }
    const manifest = new Map();
    for (const tagMatch of opfXml.matchAll(/<item\b[^>]*>/g)) {
        const tag = tagMatch[0];
        const id = attr(tag, 'id');
        const href = attr(tag, 'href');
        const mediaType = attr(tag, 'media-type') || attr(tag, 'mediatype') || '';
        if (id && href) manifest.set(id, { href, mediaType: mediaType.toLowerCase() });
    }

    // spine order of readable documents
    const spineIds = [];
    for (const tagMatch of opfXml.matchAll(/<itemref\b[^>]*>/g)) {
        const idref = attr(tagMatch[0], 'idref');
        if (idref) spineIds.push(idref);
    }

    const htmlMedia = new Set(['application/xhtml+xml', 'text/html']);
    const sections = [];
    for (const id of spineIds) {
        const item = manifest.get(id);
        if (!item || !htmlMedia.has(item.mediaType)) continue;
        const entry = zip.file(resolveHref(opfPath, item.href));
        if (!entry) continue;
        const html = await entry.async('string');
        const { title, paragraphs } = htmlToSectionBody(html);
        const md = paragraphs.join('\n\n');
        if (!md.trim()) continue;
        sections.push({ title: title || '', level: 1, md });
    }

    // Purely decorative spine items (covers, title pages) add search noise —
    // drop sections that carry (almost) no text.
    const substantial = sections.filter((sec) => (sec.md || '').replace(/\s+/g, '').length >= 40);
    const kept = substantial.length > 0 ? substantial : sections;

    return { title: bookTitle, edition: buildEdition(kept, 'extracted') };
};
