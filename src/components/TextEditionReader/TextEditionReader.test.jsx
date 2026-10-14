import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextEditionReader from './TextEditionReader';

/* Project convention (see PoliticsArticleReader.test.jsx): react-markdown and
   remark-gfm ship ESM that jest can't transform, so they are mocked as a
   passthrough. */
jest.mock('react-markdown', () => ({
    __esModule: true,
    default: ({ children }) => <div data-testid="markdown">{children}</div>,
}));
jest.mock('remark-gfm', () => ({
    __esModule: true,
    default: () => null,
}));

const edition = {
    sections: [
        { id: 's1', title: 'Front matter', level: 1, md: 'An introduction paragraph.' },
        {
            id: 's2',
            title: 'Chapter One',
            level: 1,
            md: 'The first chapter body.\n\n| Col A | Col B |\n| --- | --- |\n| 1 | 2 |',
        },
    ],
    reading_minutes: 3,
    source: 'md',
};

describe('TextEditionReader', () => {
    it('renders a rail entry per section and the markdown bodies', () => {
        render(<TextEditionReader edition={edition} />);

        expect(screen.getByRole('navigation', { name: 'Contents' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /front matter/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /chapter one/i })).toBeInTheDocument();

        const markdownBlocks = screen.getAllByTestId('markdown');
        expect(markdownBlocks).toHaveLength(2);
        expect(markdownBlocks[0].textContent).toBe('An introduction paragraph.');
        expect(markdownBlocks[1].textContent).toContain('The first chapter body.');
        expect(markdownBlocks[1].textContent).toContain('| Col A | Col B |');

        // Section anchors for the rail's scroll-spy
        expect(document.querySelector('[data-section-canonical="s1"]')).toBeInTheDocument();
        expect(document.querySelector('[data-editorial-section="true"]')).toBeInTheDocument();
        expect(screen.getByText('01 / 02 · 3 min')).toBeInTheDocument();
    });

    it('never renders markdown content as raw HTML', () => {
        render(
            <TextEditionReader
                edition={{ sections: [{ id: 's1', title: 'T', level: 1, md: '<script>alert(1)</script>' }] }}
            />
        );
        expect(document.querySelector('script')).toBeNull();
        expect(screen.getByTestId('markdown').textContent).toContain('<script>');
    });

    it('shows the empty-edition fallback when there are no sections', () => {
        render(<TextEditionReader edition={{ sections: [] }} fallbackUrl="https://example.com/book.pdf" />);
        expect(screen.getByTestId('text-edition-reader-empty')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /open the file directly/i })).toHaveAttribute(
            'href',
            'https://example.com/book.pdf'
        );
    });

    it('reports document-scroll progress through the callback', () => {
        const onProgressChange = jest.fn();
        render(<TextEditionReader edition={edition} onProgressChange={onProgressChange} />);

        // jsdom has no layout: rects are zero, so progress resolves to 0
        fireEvent.scroll(window);
        expect(onProgressChange).toHaveBeenCalledWith(0);
    });

    it('shows the sticky reading toolbar with counter and font controls', () => {
        render(<TextEditionReader edition={edition} />);
        const toolbar = screen.getByTestId('text-edition-reader-toolbar');
        expect(toolbar).toHaveStyle({ position: 'sticky' });
        expect(screen.getByRole('button', { name: 'Smaller text' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Larger text' })).toBeInTheDocument();
        expect(screen.getByText('01 / 02 · 3 min')).toBeInTheDocument();
    });

    it('opens the contents as a dialog sheet from the toolbar and closes on Escape', () => {
        render(<TextEditionReader edition={edition} />);

        const tocButton = screen.getByRole('button', { name: /table of contents/i });
        expect(tocButton).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(tocButton);

        const sheet = screen.getByRole('dialog', { name: /contents/i });
        expect(tocButton).toHaveAttribute('aria-expanded', 'true');
        expect(sheet).toHaveAttribute('aria-modal', 'true');
        expect(document.body.className).toContain('reader-toc-open');

        // Choosing a chapter closes the sheet again.
        fireEvent.click(within(sheet).getByRole('button', { name: /chapter one/i }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        fireEvent.click(tocButton);
        expect(screen.getByRole('dialog', { name: /contents/i })).toBeInTheDocument();
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(document.body.className).not.toContain('reader-toc-open');
    });

    it('silently restores the last reading position for the book', () => {
        const store = new Map([['reader-position:book-9', JSON.stringify({ sectionId: 's2', pct: 40 })]]);
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store.get(key) ?? null);
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => store.set(key, value));

        render(<TextEditionReader edition={edition} bookId="book-9" />);

        // Scrolling persists the resting section (throttled, but a fresh
        // mount always allows the first write).
        fireEvent.scroll(window);
        const saved = JSON.parse(store.get('reader-position:book-9'));
        expect(saved.sectionId).toBe('s1'); // jsdom rects are zero — top section is active

        Storage.prototype.getItem.mockRestore();
        Storage.prototype.setItem.mockRestore();
    });
});
