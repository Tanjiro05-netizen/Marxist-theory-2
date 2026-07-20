import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PoliticsUploadPage from './PoliticsUploadPage';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { useRouter } from 'next/navigation';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('../../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../../supabaseClient', () => ({
    supabase: {
        from: jest.fn(),
        storage: {
            from: jest.fn(),
        },
    },
}));

const mockUseAuth = useAuth;

const buildFetchArticlesQuery = (articles = []) => {
    const query = {
        select: jest.fn(() => query),
        order: jest.fn(() => query),
        limit: jest.fn().mockResolvedValue({ data: articles, error: null }),
    };

    return query;
};

const buildSlugLookupQuery = (existing = null) => {
    const query = {
        select: jest.fn(() => query),
        eq: jest.fn(() => query),
        neq: jest.fn(() => query),
        limit: jest.fn(() => query),
        maybeSingle: jest.fn().mockResolvedValue({ data: existing, error: null }),
    };

    return query;
};

describe('PoliticsUploadPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.scrollTo = jest.fn();
        useRouter.mockReturnValue({ push: mockPush, replace: mockReplace, back: jest.fn() });

        mockUseAuth.mockReturnValue({
            user: { id: '123e4567-e89b-12d3-a456-426614174000' },
            canManagePolitics: jest.fn(() => true),
        });

        supabase.storage.from.mockReturnValue({
            upload: jest.fn(),
            getPublicUrl: jest.fn(),
        });
    });

    test('asks for confirmation before navigating away when editor has unsaved changes', async () => {
        const fetchQuery = buildFetchArticlesQuery([]);
        supabase.from.mockReturnValue(fetchQuery);

        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

        render(<PoliticsUploadPage />);

        expect(await screen.findByText('No politics dispatches yet.')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Front-page headline'), {
            target: { name: 'title', value: 'Unsaved Dispatch' },
        });

        fireEvent.click(screen.getByLabelText('Back to politics page'));

        expect(confirmSpy).toHaveBeenCalledWith('You have unsaved editor changes. Leave this page anyway?');
        expect(mockPush).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
    });

    test('pre-checks slug uniqueness and suggests a new slug when a collision exists', async () => {
        const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1710000000456);

        const fetchQuery = buildFetchArticlesQuery([]);
        const slugLookupQuery = buildSlugLookupQuery({ id: 'existing-article' });

        let politicsFromCalls = 0;
        supabase.from.mockImplementation((tableName) => {
            if (tableName !== 'politics_articles') {
                throw new Error(`Unexpected table ${tableName}`);
            }

            politicsFromCalls += 1;
            return politicsFromCalls === 1 ? fetchQuery : slugLookupQuery;
        });

        render(<PoliticsUploadPage />);

        expect(await screen.findByText('No politics dispatches yet.')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Front-page headline'), {
            target: { name: 'title', value: 'Duplicate Dispatch' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Create dispatch' }));

        await waitFor(() => {
            expect(slugLookupQuery.maybeSingle).toHaveBeenCalled();
        });

        expect(
            await screen.findByText('This slug is already in use. We suggested a new slug; please review and save again.')
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByPlaceholderText('headline-slug')).toHaveValue('duplicate-dispatch-0456');
        });

        nowSpy.mockRestore();
    });

    test('does not show unsaved state immediately after loading an existing dispatch', async () => {
        const fetchQuery = buildFetchArticlesQuery([
            {
                id: 'dispatch-1',
                title: 'Existing Dispatch',
                slug: 'existing-dispatch',
                excerpt: 'Existing excerpt',
                content: 'Body',
                category: 'analysis',
                digest_type: 'world',
                source: 'Editorial Desk',
                image_url: null,
                placement: 'lead',
                edition_date: '2026-03-03',
                status: 'published',
                published_at: '2026-03-03T12:30:00.000Z',
            },
        ]);

        supabase.from.mockReturnValue(fetchQuery);

        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

        render(<PoliticsUploadPage />);

        await screen.findByText('Existing Dispatch');

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

        await waitFor(() => {
            expect(screen.queryByText('Unsaved changes in editor.')).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText('Back to politics page'));

        expect(confirmSpy).not.toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/politics');

        confirmSpy.mockRestore();
    });
});
