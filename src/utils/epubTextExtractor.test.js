import { readFile } from 'fs/promises';
import path from 'path';
import { parseEpubBuffer, htmlToSectionBody } from './epubTextExtractor';

const EPUB_PATH = path.join(process.cwd(), 'selected-works-karl-marx.epub');

describe('htmlToSectionBody', () => {
    test('converts headings and paragraphs to markdown', () => {
        const html = `
            <html><head><title>Ignored</title></head><body>
                <h1 class="ch">Chapter One</h1>
                <p>The first &amp; only <em>paragraph</em>.</p>
                <p>Second paragraph&#160;with nbsp.</p>
            </body></html>
        `;
        const { title, paragraphs } = htmlToSectionBody(html);
        expect(title).toBe('Chapter One');
        expect(paragraphs[0]).toBe('# Chapter One');
        expect(paragraphs).toContain('The first & only paragraph.');
        expect(paragraphs.some((p) => p.includes('nbsp'))).toBe(true);
    });

    test('drops scripts, styles and comments', () => {
        const { paragraphs } = htmlToSectionBody(
            '<body><!-- note --><script>var x = "<p>evil</p>";</script><style>p{}</style><p>Kept</p></body>'
        );
        expect(paragraphs).toEqual(['Kept']);
    });

    test('is safe on empty input', () => {
        expect(htmlToSectionBody('')).toEqual({ title: null, paragraphs: [] });
    });
});

describe('parseEpubBuffer', () => {
    test('extracts a real EPUB into a valid text edition', async () => {
        const buffer = await readFile(EPUB_PATH);
        const { title, edition } = await parseEpubBuffer(buffer);

        expect(title).toBe('Selected Works of Karl Marx');
        expect(edition.source).toBe('extracted');
        expect(edition.reading_minutes).toBeGreaterThan(100);
        expect(edition.sections.length).toBeGreaterThan(5);

        const manifesto = edition.sections.find((sec) => /Communist Manifesto/i.test(sec.title || ''));
        expect(manifesto).toBeDefined();
        expect(manifesto.id).toMatch(/^s\d+$/);
        expect(manifesto.md).toMatch(/#/); // headings survived as markdown
        // Typographic entities decoded, not left as &ldquo; litter.
        expect(manifesto.md).not.toContain('&ldquo;');
        expect(manifesto.md.toLowerCase()).toContain('spectre');
    });

    test('rejects non-EPUB buffers with a clear error', async () => {
        await expect(parseEpubBuffer(Buffer.from('not a zip'))).rejects.toThrow(/EPUB/i);
    });
});
