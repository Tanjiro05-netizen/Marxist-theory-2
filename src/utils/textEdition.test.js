import {
    splitMarkdown,
    splitPlainText,
    readingMinutes,
    detectKind,
    buildEdition,
    escapeMarkdownLineStarts,
    parseSourceFile,
} from './textEdition';

describe('splitMarkdown', () => {
    it('splits at heading lines and captures level + title', () => {
        const src = [
            '# Chapter One',
            'First body.',
            '',
            '## A subsection',
            'Sub body.',
            '# Chapter Two',
            'Second body.',
        ].join('\n');

        const sections = splitMarkdown(src);
        expect(sections.map((s) => s.title)).toEqual([
            'Chapter One',
            'A subsection',
            'Chapter Two',
        ]);
        expect(sections.map((s) => s.level)).toEqual([1, 2, 1]);
        expect(sections[0].md).toBe('First body.');
        expect(sections[2].md).toBe('Second body.');
    });

    it('keeps non-empty preamble as a Front matter section', () => {
        const sections = splitMarkdown('Intro paragraph.\n\n# Chapter One\nBody.');
        expect(sections[0].title).toBe('Front matter');
        expect(sections[0].md).toBe('Intro paragraph.');
        expect(sections[1].title).toBe('Chapter One');
    });

    it('drops an empty preamble entirely', () => {
        const sections = splitMarkdown('# Only Heading\nBody.');
        expect(sections).toHaveLength(1);
        expect(sections[0].title).toBe('Only Heading');
    });

    it('returns [] for empty or whitespace-only input', () => {
        expect(splitMarkdown('')).toEqual([]);
        expect(splitMarkdown('   \n\n  ')).toEqual([]);
    });

    it('assigns unique sequential ids', () => {
        const sections = splitMarkdown('# A\nx\n# B\ny\n# C\nz');
        const ids = sections.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toEqual(['s1', 's2', 's3']);
    });

    it('ignores closing hashes on ATX headings', () => {
        const sections = splitMarkdown('## Title ##\nBody.');
        expect(sections[0].title).toBe('Title');
    });
});

describe('splitPlainText', () => {
    it('detects Chapter/Part lines as level-1 sections', () => {
        const src = 'Chapter 1: Beginnings\n\nIt starts here.\n\nPart II: Later\n\nIt continues.';
        const sections = splitPlainText(src);
        expect(sections.map((s) => s.title)).toEqual([
            'Chapter 1: Beginnings',
            'Part II: Later',
        ]);
        expect(sections.every((s) => s.level === 1)).toBe(true);
    });

    it('detects bare roman numerals as headings', () => {
        const sections = splitPlainText('I.\nFirst.\n\nII.\nSecond.');
        expect(sections.map((s) => s.title)).toEqual(['I.', 'II.']);
    });

    it('detects and title-cases short ALL-CAPS lines', () => {
        const src = 'THE GRAVEYARD OF URAL\n\nSomething happens.';
        const sections = splitPlainText(src);
        expect(sections[0].title).toBe('The Graveyard Of Ural');
    });

    it('does not treat ordinary prose as a caps heading', () => {
        const sections = splitPlainText('This is just a normal sentence about the USSR, nothing more.');
        expect(sections).toHaveLength(1);
        expect(sections[0].title).toBe('Front matter');
    });

    it('escapes markdown sigils at prose line starts', () => {
        const src = 'Chapter 1\n\n# not a heading\n* emphasis-like prose\n1. numbered prose\n- dash prose\n> quote-like';
        const body = splitPlainText(src)[0].md;
        expect(body).toContain('\\# not a heading');
        expect(body).toContain('\\* emphasis-like prose');
        expect(body).toContain('\\1. numbered prose');
        expect(body).toContain('\\- dash prose');
        expect(body).toContain('\\> quote-like');
    });

    it('keeps normal punctuation lines untouched', () => {
        const body = splitPlainText('Chapter 1\n\nLabour is the substance of value.')[0].md;
        expect(body).toBe('Labour is the substance of value.');
    });

    it('nests Chapters under Parts (level 2) and Sections deeper (level 3)', () => {
        const src = [
            'Part I: Commodities and Money',
            'Chapter One: Commodities',
            'Body of chapter one.',
            'Section 1: The Two Factors of the Commodity',
            'Body of section one.',
        ].join('\n');
        const sections = splitPlainText(src);
        expect(sections.map((s) => [s.title, s.level])).toEqual([
            ['Part I: Commodities and Money', 1],
            ['Chapter One: Commodities', 2],
            ['Section 1: The Two Factors of the Commodity', 3],
        ]);
    });

    it('detects standalone title-case subheadings between blank lines', () => {
        const src = ['Prefaces', '', 'The 1872 German Edition', '', 'The Communist League commissioned us.'].join('\n');
        const sections = splitPlainText(src);
        expect(sections.map((s) => s.title)).toEqual(['Prefaces', 'The 1872 German Edition']);
        expect(sections[1].md).toBe('The Communist League commissioned us.');
    });

    it('does not treat sentence prose as a standalone subheading', () => {
        const src = ['This line ends with a period.', '', 'Next paragraph here.'].join('\n');
        const sections = splitPlainText(src);
        expect(sections).toHaveLength(1);
        expect(sections[0].title).toBe('Front matter');
    });

    it('drops communist-left ====== divider lines from the body', () => {
        const body = splitPlainText('Chapter 1\n\n======\n\nReal body.')[0].md;
        expect(body).toBe('Real body.');
    });
});

describe('parseSourceFile', () => {
    it('extracts title, source URL and body from the scrape header', () => {
        const raw = 'Manifesto of the Communist Party\nSource: https://communist-left.org/texts/manifesto.html\n======================\n\nA spectre is haunting Europe.';
        const parsed = parseSourceFile(raw);
        expect(parsed.title).toBe('Manifesto of the Communist Party');
        expect(parsed.sourceUrl).toBe('https://communist-left.org/texts/manifesto.html');
        expect(parsed.body.trim()).toBe('A spectre is haunting Europe.');
    });

    it('passes through files without the header block', () => {
        const parsed = parseSourceFile('Just some prose.\nMore prose.');
        expect(parsed.title).toBeNull();
        expect(parsed.sourceUrl).toBeNull();
        expect(parsed.body).toBe('Just some prose.\nMore prose.');
    });
});

describe('readingMinutes', () => {
    it('computes words / 200 with a minimum of 1', () => {
        expect(readingMinutes('')).toBe(1);
        expect(readingMinutes('one ' + 'word '.repeat(199))).toBe(1);
        expect(readingMinutes('word '.repeat(400))).toBe(2);
        expect(readingMinutes('word '.repeat(1000))).toBe(5);
    });
});

describe('detectKind', () => {
    it('uses the file extension first', () => {
        expect(detectKind('book.md', 'no headings')).toBe('md');
        expect(detectKind('book.txt', '# has heading')).toBe('txt');
    });

    it('falls back to content sniffing without extension', () => {
        expect(detectKind('book', '# Heading\n\ntext')).toBe('md');
        expect(detectKind('book', 'Just plain prose.')).toBe('txt');
    });
});

describe('buildEdition', () => {
    it('assembles the persisted shape with computed reading time', () => {
        const edition = buildEdition(
            [
                { id: 's1', title: 'One', level: 1, md: 'word '.repeat(300) },
                { title: 'Two', level: 2, md: 'word '.repeat(100) },
            ],
            'md'
        );
        expect(edition.source).toBe('md');
        expect(edition.reading_minutes).toBe(2);
        expect(edition.sections[1].id).toBeTruthy();
        expect(edition.generated_at).toBeTruthy();
    });

    it('drops sections with neither title nor body', () => {
        const edition = buildEdition([{ title: '', md: '   ' }, { title: 'Real', md: 'x' }], 'txt');
        expect(edition.sections).toHaveLength(1);
    });
});

describe('escapeMarkdownLineStarts', () => {
    it('leaves ordinary lines alone', () => {
        expect(escapeMarkdownLineStarts('plain text\nanother line')).toBe('plain text\nanother line');
    });

    it('escapes code fences so they render literally', () => {
        expect(escapeMarkdownLineStarts('```js')).toBe('\\```js');
    });
});
