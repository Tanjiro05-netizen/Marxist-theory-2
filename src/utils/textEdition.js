/**
 * Text-edition utilities — turn a raw source text (.md preferred, .txt or a
 * pdf.js extraction) into the sectioned markdown shape stored in
 * digital_library_books.text_edition and rendered by TextEditionReader.
 *
 * Everything here is DOM-free so it runs identically in Node (jest) and the
 * browser (admin panel).
 */

export const FRONT_MATTER_TITLE = 'Front matter';

let sectionCounter = 0;
const nextSectionId = () => {
    sectionCounter += 1;
    return `s${sectionCounter}`;
};

/** Total minutes to read at ~200 wpm, always at least one. */
export const readingMinutes = (md) => {
    const words = `${md || ''}`.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
};

/**
 * Split a markdown source at heading lines into sections. The heading becomes
 * the section title (rail label) and everything up to the next heading becomes
 * that section's markdown body. Non-empty text before the first heading is
 * kept as a "Front matter" section.
 */
export const splitMarkdown = (src) => {
    sectionCounter = 0;
    const lines = `${src || ''}`.replace(/\r\n?/g, '\n').split('\n');

    const sections = [];
    let current = null;
    const preamble = [];

    for (const line of lines) {
        const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
        if (match) {
            if (current) sections.push(current);
            current = {
                id: nextSectionId(),
                title: match[2].trim(),
                level: match[1].length,
                md: '',
            };
        } else if (current) {
            current.md += (current.md ? '\n' : '') + line;
        } else {
            preamble.push(line);
        }
    }
    if (current) sections.push(current);

    const frontMatter = preamble.join('\n').trim();
    if (frontMatter) {
        sections.unshift({
            id: nextSectionId(),
            title: FRONT_MATTER_TITLE,
            level: 1,
            md: frontMatter,
        });
    }

    return sections
        .map((sec) => ({ ...sec, md: sec.md.trim() }))
        .filter((sec) => sec.md.length > 0 || sec.title !== FRONT_MATTER_TITLE);
};

/**
 * Parse the header block that communist-left.org scrapes carry:
 *   Line 1: Title
 *   Line 2: Source: https://…
 *   Line 3: ============== divider
 * Returns the title, source URL and the remaining body text.
 */
export const parseSourceFile = (raw) => {
    const text = `${raw || ''}`.replace(/\r\n?/g, '\n');
    const lines = text.split('\n');

    let title = null;
    let sourceUrl = null;
    let bodyStart = 0;

    // Only recognise the scrape header on a strong signal: a "Source:" line
    // or the "=====" divider right after the title line.
    const sourceMatch = lines.length > 1 ? /^Source:\s*(\S+)/i.exec(lines[1].trim()) : null;
    if (lines[0]?.trim() && (sourceMatch || /^=+$/.test((lines[1] || '').trim()))) {
        title = lines[0].trim();
        if (sourceMatch) {
            sourceUrl = sourceMatch[1];
            bodyStart = 2;
        } else {
            bodyStart = 1;
        }
    }
    if (/^=+$/.test((lines[bodyStart] || '').trim())) bodyStart += 1;

    return { title, sourceUrl, body: lines.slice(bodyStart).join('\n') };
};

/*
 * Plain-text heading heuristics, in priority order. Adapted from the old
 * formatBookContent.js chapter splitter. Levels nest contextually: a Chapter
 * under a Part becomes level 2, a Section under both becomes level 3.
 */
const NUMERAL = '(?:[ivxlc]+|\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)';

const TXT_HEADING_PATTERNS = [
    { re: new RegExp(`^(part\\s+${NUMERAL}.*)$`, 'i'), kind: 'part' },
    { re: new RegExp(`^(chapter\\s+${NUMERAL}.*)$`, 'i'), kind: 'chapter' },
    { re: /^(preface|foreword|introduction|afterword|appendix|conclusion|epilogue|prologue)\b.*$/i, kind: 'chapter' },
    { re: new RegExp(`^(section\\s+${NUMERAL}.*)$`, 'i'), kind: 'section' },
    { re: /^([ivxlc]{1,7}\.?)$/i, kind: 'section' },
    { re: /^([ivxlc]{1,7})\.\s+\S.*$/i, kind: 'section' },
];

/* Contextual level: 1 for top level, +1 under a Part, +1 under a Chapter. */
const levelFor = (kind, ctx) => {
    if (kind === 'part') return 1;
    if (kind === 'chapter') return ctx.partSeen ? 2 : 1;
    return Math.min(3, 1 + (ctx.partSeen ? 1 : 0) + (ctx.chapterSeen ? 1 : 0));
};

/* Line-initial markdown sigils that prose must not accidentally trigger. */
const MD_SIGIL = /^([#*+>-]|```|\d{1,3}[.)]\s)/;

export const escapeMarkdownLineStarts = (text) =>
    text
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line) => (MD_SIGIL.test(line) ? `\\${line}` : line))
        .join('\n');

const titleCaseCaps = (line) =>
    line
        .trim()
        .toLowerCase()
        .replace(/(^|\s|["'("])([a-z])/g, (m, p, c) => p + c.toUpperCase());

const isCapsHeading = (line) => {
    const trimmed = line.trim();
    if (trimmed.length < 3 || trimmed.length > 48) return false;
    const letters = trimmed.replace(/[^A-Za-z]/g, '');
    if (letters.length < 3) return false;
    const caps = letters.replace(/[^A-Z]/g, '');
    return caps.length / letters.length >= 0.9 && !/[.!?]$/.test(trimmed);
};

/* Standalone title-case subheading: a short line between blank lines with no
   terminal punctuation — catches "Prefaces", "The 1872 German Edition" and
   friends in already-formatted texts. Conservative on purpose; misses are
   curable in the admin section editor. */
const isStandaloneSubheading = (line, prevLine, nextLine) => {
    const trimmed = line.trim();
    if (trimmed.length < 2 || trimmed.length > 60) return false;
    // Blank line (or start of document) before, blank line after.
    const prevBlank = prevLine === undefined || !prevLine.trim();
    const nextBlank = nextLine !== undefined && !nextLine.trim();
    if (!prevBlank || !nextBlank) return false;
    if (/[.!?:;,:]$/.test(trimmed)) return false;
    if (/^[a-z]/.test(trimmed)) return false;
    if (/^[\dIVXLCivxlc.()\s]+$/.test(trimmed)) return false; // numerals handled elsewhere
    return true;
};

/**
 * Split a plain-text source into sections using heading heuristics: explicit
 * Part/Chapter/Section lines (nested contextually — Chapter under Part is
 * level 2), bare roman numerals, short ALL-CAPS lines, and standalone
 * title-case subheadings. The communist-left "======" dividers are dropped,
 * and prose line-starts that would collide with markdown sigils are escaped
 * so they can never render as syntax.
 */
export const splitPlainText = (src) => {
    sectionCounter = 0;
    const rawLines = `${src || ''}`.replace(/\r\n?/g, '\n').split('\n');
    const lines = rawLines.filter((line) => !/^={3,}\s*$/.test(line.trim()));

    const ctx = { partSeen: false, chapterSeen: false };
    const sections = [];
    let current = null;
    const preamble = [];

    const pushCurrent = () => {
        if (current) sections.push(current);
    };

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        const trimmed = line.trim();
        let heading = null;

        for (const { re, kind } of TXT_HEADING_PATTERNS) {
            const match = re.exec(trimmed);
            if (match) {
                heading = { title: match[1].trim(), kind };
                break;
            }
        }
        if (!heading && isCapsHeading(trimmed)) {
            heading = { title: titleCaseCaps(trimmed), kind: 'section' };
        }
        if (!heading && isStandaloneSubheading(trimmed, lines[i - 1], lines[i + 1])) {
            heading = { title: trimmed, kind: 'section' };
        }

        if (heading) {
            if (heading.kind === 'part') ctx.partSeen = true;
            if (heading.kind === 'chapter') ctx.chapterSeen = true;
            pushCurrent();
            current = {
                id: nextSectionId(),
                title: heading.title,
                level: levelFor(heading.kind, ctx),
                md: '',
            };
        } else if (current) {
            current.md += (current.md ? '\n' : '') + escapeMarkdownLineStarts(line);
        } else {
            preamble.push(escapeMarkdownLineStarts(line));
        }
    }
    pushCurrent();

    const frontMatter = preamble.join('\n').trim();
    if (frontMatter) {
        sections.unshift({
            id: nextSectionId(),
            title: FRONT_MATTER_TITLE,
            level: 1,
            md: frontMatter,
        });
    }

    return sections
        .map((sec) => ({ ...sec, md: sec.md.trim() }))
        .filter((sec) => sec.md.length > 0 || sec.title !== FRONT_MATTER_TITLE);
};

/** Guess whether an uploaded source is markdown or plain text. */
export const detectKind = (filename, content) => {
    if (/\.(md|markdown|mdown)$/i.test(filename || '')) return 'md';
    if (/\.(txt|text)$/i.test(filename || '')) return 'txt';
    const sample = `${content || ''}`.split('\n').slice(0, 200).join('\n');
    return /^#{1,6}\s+\S/m.test(sample) ? 'md' : 'txt';
};

/** Split with the right strategy for the detected kind. */
export const splitSource = (kind, src) =>
    kind === 'md' ? splitMarkdown(src) : splitPlainText(src);

/** Assemble the persisted edition object from edited sections. */
export const buildEdition = (sections, source) => ({
    sections: (sections || [])
        .filter((sec) => sec && (`${sec.md || ''}`.trim() || `${sec.title || ''}`.trim()))
        .map((sec) => ({
            id: sec.id || nextSectionId(),
            title: `${sec.title || ''}`.trim(),
            level: sec.level || 1,
            md: `${sec.md || ''}`.trim(),
        })),
    reading_minutes: readingMinutes((sections || []).map((sec) => sec.md || '').join('\n')),
    source: source || 'manual',
    generated_at: new Date().toISOString(),
});
