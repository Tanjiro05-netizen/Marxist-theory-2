import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GlobalSearch from './GlobalSearch';
import { searchSite } from '../../services/siteSearch';
import { useRouter } from 'next/navigation';

jest.mock('../../services/siteSearch', () => {
    const actual = jest.requireActual('../../services/siteSearch');
    return { ...actual, searchSite: jest.fn() };
});

/* The real service imports the Supabase client, which asserts env config. */
jest.mock('../../supabaseClient', () => ({
    supabase: { from: jest.fn(() => ({})), rpc: jest.fn() },
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, opts) => {
            const strings = {
                'search.placeholder': 'Search everything',
                'search.hint': 'Type at least 2 characters',
                'search.searching': 'Searching…',
                'search.noResults': 'No results for "{{query}}"',
                'search.groupBooks': 'Books',
                'search.groupPassages': 'Passages in the texts',
                'search.groupCourses': 'Science courses',
                'search.groupSubstack': 'Substack',
                'search.groupAudiobooks': 'Audiobooks',
                'search.groupPages': 'Pages',
                'search.navigate': 'navigate',
                'search.open': 'open',
                'search.close': 'close',
                'search.allInLibrary': 'All library results for "{{query}}"',
                'search.allWords': 'all words',
                'nav.home': 'Home',
                'nav.library': 'Digital Library',
            };
            let str = strings[key] || key;
            if (opts) {
                Object.entries(opts).forEach(([name, value]) => {
                    str = str.split(`{{${name}}}`).join(String(value));
                });
            }
            return str;
        },
    }),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

const mockSearchSite = searchSite;
const mockUseRouter = useRouter;

const PASSAGE_ROW = {
    book_id: 'b1',
    title: 'Capital Vol I',
    section_id: 's3',
    section_title: 'Chapter 3',
    snippet: 'the transformation of money into capital',
    match_offset: 22,
    match_len: 19,
    snippet_cut_start: false,
    snippet_cut_end: false,
    is_exact: true,
    book_match_count: 1,
};

describe('GlobalSearch', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSearchSite.mockResolvedValue({
            pages: [],
            books: [{ id: 'b1', title: 'Capital Vol I', author: 'Marx', year: 1867, category: null, href: '/book/b1' }],
            passages: [
                {
                    ...PASSAGE_ROW,
                    href: `/book/${PASSAGE_ROW.book_id}?section=${PASSAGE_ROW.section_id}&q=money%20into%20capital`,
                },
            ],
            courses: [],
            substack: [],
            audiobooks: [],
        });
    });

    test('renders nothing until opened', () => {
        const { container } = render(<GlobalSearch open={false} onClose={jest.fn()} />);
        expect(container).toBeEmptyDOMElement();
    });

    test('searches after the debounce and renders grouped results with deep links', async () => {
        render(<GlobalSearch open onClose={jest.fn()} />);

        const input = screen.getByTestId('global-search-input');
        fireEvent.change(input, { target: { value: 'money into capital' } });

        await waitFor(
            () => {
                expect(screen.getByTestId('global-search-group-passages')).toBeInTheDocument();
            },
            { timeout: 3000 }
        );

        expect(mockSearchSite).toHaveBeenCalledWith('money into capital', { labelTranslator: expect.any(Function) });

        const bookLink = screen.getAllByTestId('global-search-item')[0];
        expect(bookLink).toHaveAttribute('href', '/book/b1');

        const passageLink = screen.getAllByTestId('global-search-item')[1];
        expect(passageLink).toHaveAttribute('href', '/book/b1?section=s3&q=money%20into%20capital');
        expect(passageLink.querySelector('mark.lib-hit')).toHaveTextContent('money into capital');
        expect(screen.getByTestId('global-search-all-library')).toHaveAttribute(
            'href',
            '/digital-library?q=money%20into%20capital'
        );
    });

    test('Enter opens the active result and closes the palette', async () => {
        const onClose = jest.fn();
        render(<GlobalSearch open onClose={onClose} />);

        fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'money' } });
        await waitFor(() => {
            expect(screen.getAllByTestId('global-search-item').length).toBeGreaterThan(0);
        }, { timeout: 3000 });

        fireEvent.keyDown(screen.getByTestId('global-search-input'), { key: 'Enter' });

        expect(mockPush).toHaveBeenCalledWith('/book/b1');
        expect(onClose).toHaveBeenCalled();
    });

    test('Escape closes and arrow keys move the active item', async () => {
        const onClose = jest.fn();
        render(<GlobalSearch open onClose={onClose} />);

        fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'money' } });
        await waitFor(() => {
            expect(screen.getAllByTestId('global-search-item').length).toBe(2);
        }, { timeout: 3000 });

        const items = screen.getAllByTestId('global-search-item');
        expect(items[0]).toHaveAttribute('data-active', 'true');

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();

        fireEvent.keyDown(screen.getByTestId('global-search-input'), { key: 'ArrowDown' });
        // A re-resolving search can reset the active index after the keydown —
        // poll until the arrow move lands rather than asserting synchronously.
        await waitFor(() => {
            expect(screen.getAllByTestId('global-search-item')[1]).toHaveAttribute('data-active', 'true');
        }, { timeout: 3000 });
    });

    test('shows the empty state when nothing matches', async () => {
        mockSearchSite.mockResolvedValue({
            pages: [], books: [], passages: [], courses: [], substack: [], audiobooks: [],
        });
        render(<GlobalSearch open onClose={jest.fn()} />);

        fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'zzznothing' } });
        await waitFor(() => {
            expect(screen.getByTestId('global-search-empty')).toHaveTextContent('No results for "zzznothing"');
        }, { timeout: 3000 });
    });
});
