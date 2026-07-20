import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useParams } from 'next/navigation';
import PoliticsArticleReader from './PoliticsArticleReader';

jest.mock('react-markdown', () => ({
    __esModule: true,
    default: ({ children }) => <div data-testid="markdown">{children}</div>,
}));

jest.mock('remark-gfm', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../supabaseClient', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

const mockUseAuth = useAuth;
const mockUseParams = useParams;

describe('PoliticsArticleReader access query behavior', () => {
    const mockArticle = {
        id: 'article-1',
        slug: 'dispatch-1',
        title: 'Dispatch 1',
        content: 'Body',
        status: 'published',
    };

    const buildQueryChain = () => {
        const query = {
            data: [],
            error: null,
            select: jest.fn(() => query),
            eq: jest.fn(() => query),
            neq: jest.fn(() => query),
            order: jest.fn(() => query),
            limit: jest.fn(() => query),
            maybeSingle: jest.fn().mockResolvedValue({ data: mockArticle, error: null }),
        };
        return query;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseParams.mockReturnValue({ slug: 'dispatch-1' });
    });

    test('non-editors include published status filter', async () => {
        const query = buildQueryChain();

        mockUseAuth.mockReturnValue({
            canManagePolitics: jest.fn(() => false),
        });

        supabase.from.mockReturnValue(query);

        render(<PoliticsArticleReader />);

        await waitFor(() => {
            expect(query.maybeSingle).toHaveBeenCalled();
        });
        await screen.findByText('Dispatch 1');

        expect(query.eq).toHaveBeenCalledWith('slug', 'dispatch-1');
        expect(query.eq).toHaveBeenCalledWith('status', 'published');
    });

    test('editors do not enforce published status filter', async () => {
        const query = buildQueryChain();

        mockUseAuth.mockReturnValue({
            canManagePolitics: jest.fn(() => true),
        });

        supabase.from.mockReturnValue(query);

        render(<PoliticsArticleReader />);

        await waitFor(() => {
            expect(query.maybeSingle).toHaveBeenCalled();
        });
        await screen.findByText('Dispatch 1');

        expect(query.eq).toHaveBeenCalledWith('slug', 'dispatch-1');
        expect(query.eq).not.toHaveBeenCalledWith('status', 'published');
    });
});
