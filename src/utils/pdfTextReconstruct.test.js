import {
    groupItemsIntoLines,
    detectHeading,
    linesToParagraphs,
    reconstructFromPdfPages,
    isLikelyScanned,
} from './pdfTextReconstruct';

/* Helpers that build pdf.js-shaped items: transform = [a,b,c,d,x,y], y grows upward. */
const item = (str, x, y, height = 10, width = str.length * 5) => ({
    str,
    width,
    transform: [1, 0, 0, height, x, y],
});

describe('groupItemsIntoLines', () => {
    it('clusters items that share a baseline and orders them left to right', () => {
        const lines = groupItemsIntoLines([
            item('world', 60, 100),
            item('Hello ', 10, 100),
            item('second line', 10, 80),
        ]);
        expect(lines).toHaveLength(2);
        expect(lines[0].text).toBe('Hello world');
        expect(lines[1].text).toBe('second line');
    });

    it('tolerates small baseline jitter within one line', () => {
        const lines = groupItemsIntoLines([item('a', 10, 100), item('b', 30, 96)]);
        expect(lines).toHaveLength(1);
        expect(lines[0].text).toBe('a b');
    });

    it('drops whitespace-only items', () => {
        expect(groupItemsIntoLines([item(' ', 10, 100), item('', 20, 100)])).toEqual([]);
    });
});

describe('detectHeading', () => {
    const body = { text: 'ordinary body prose', height: 10, width: 300 };

    it('recognises structural chapter lines', () => {
        expect(detectHeading({ ...body, text: 'Chapter 3: The Crisis' }, 10)).toEqual({
            title: 'Chapter 3: The Crisis',
            level: 1,
        });
    });

    it('recognises ALL-CAPS short lines', () => {
        expect(detectHeading({ ...body, text: 'THEORY OF THE PROLETARIAT' }, 10)?.level).toBe(2);
    });

    it('recognises font-size outliers as headings', () => {
        const big = { text: 'A Big Title', height: 15, width: 100 };
        expect(detectHeading(big, 10)).toEqual({ title: 'A Big Title', level: 2 });
        expect(detectHeading({ ...big, height: 10 }, 10)).toBeNull();
    });

    it('rejects long lines and sentence-like lines', () => {
        const long = 'ALL CAPS BUT FAR TOO LONG TO BE A HEADING OF ANY REAL BOOK PAGE';
        expect(detectHeading({ ...body, text: long }, 10)).toBeNull();
        expect(detectHeading({ ...body, text: 'Sentence ends here.' }, 10)).toBeNull();
    });
});

describe('linesToParagraphs', () => {
    const line = (text, y, width = 300, height = 10) => ({ text, y, width, height });

    it('joins wrapped lines into one paragraph', () => {
        const paragraphs = linesToParagraphs([
            line('The first half of a', 100),
            line('wrapped sentence.', 90),
        ]);
        expect(paragraphs).toEqual(['The first half of a wrapped sentence.']);
    });

    it('breaks paragraphs on vertical gaps', () => {
        const paragraphs = linesToParagraphs([
            line('First paragraph.', 100),
            line('Second paragraph after a gap.', 60),
        ]);
        expect(paragraphs).toEqual(['First paragraph.', 'Second paragraph after a gap.']);
    });

    it('breaks after a short sentence-terminal line', () => {
        const paragraphs = linesToParagraphs([
            line('Paragraph one.', 100, 80),
            line('Paragraph two starts here.', 92, 300),
        ]);
        expect(paragraphs).toEqual(['Paragraph one.', 'Paragraph two starts here.']);
    });

    it('dehyphenates line-broken words', () => {
        const paragraphs = linesToParagraphs([
            line('capitalisa-', 100),
            line('tion continues.', 90),
        ]);
        expect(paragraphs).toEqual(['capitalisation continues.']);
    });

    it('turns headings into ##-prefixed paragraphs', () => {
        const paragraphs = linesToParagraphs([line('Chapter 4: Value', 100)]);
        expect(paragraphs).toEqual(['## Chapter 4: Value']);
    });
});

describe('reconstructFromPdfPages', () => {
    it('builds sections split at detected headings', () => {
        const { sections } = reconstructFromPdfPages([
            [
                item('Chapter 1', 50, 300, 14),
                item('Body of the first chapter.', 40, 280),
                item('Chapter 2', 50, 200, 14),
                item('Body of the second chapter.', 40, 180),
            ],
        ]);
        expect(sections.map((s) => s.title)).toEqual(['Chapter 1', 'Chapter 2']);
        expect(sections[0].md).toContain('Body of the first chapter.');
    });

    it('always breaks paragraphs at page boundaries', () => {
        const { sections } = reconstructFromPdfPages([
            [item('One two', 40, 100), item('three four.', 40, 90)],
            [item('Five six.', 40, 100)],
        ]);
        const body = sections[0].md;
        expect(body).toBe('One two three four.\n\nFive six.');
    });

    it('flags scanned PDFs by chars-per-page', () => {
        const { stats } = reconstructFromPdfPages([[item('x', 0, 0)], [item('y', 0, 0)]]);
        expect(stats.likelyScanned).toBe(true);
        expect(stats.pages).toBe(2);
    });

    it('reports healthy stats for a text-rich page', () => {
        const { stats } = reconstructFromPdfPages([
            Array.from({ length: 30 }, (_, i) => item(`word number ${i} here `, 10, 700 - (i % 40) * 15)),
        ]);
        expect(stats.likelyScanned).toBe(false);
        expect(stats.chars).toBeGreaterThan(100);
    });
});

describe('isLikelyScanned', () => {
    it('needs less than 100 chars per page', () => {
        expect(isLikelyScanned(50, 1)).toBe(true);
        expect(isLikelyScanned(1500, 10)).toBe(false);
        expect(isLikelyScanned(0, 0)).toBe(false);
    });
});
