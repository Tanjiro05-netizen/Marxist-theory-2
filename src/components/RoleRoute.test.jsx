import React from 'react';
import { render, screen } from '@testing-library/react';
import RoleRoute from './RoleRoute';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('./RedirectTo.jsx', () => ({ href }) => <div data-testid="navigate" data-to={href} />);

const mockUseAuth = useAuth;

const renderRoute = (props = {}) =>
    render(
        <RoleRoute allowedEditorialRoles={['News']} {...props}>
            <div>Protected Content</div>
        </RoleRoute>
    );

describe('RoleRoute', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('shows loading state while auth is loading', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: true,
            isAdmin: jest.fn(() => false),
            hasEditorialRole: jest.fn(() => false),
        });

        renderRoute();

        expect(screen.getByText('Checking permissions...')).toBeInTheDocument();
    });

    test('redirects to login when user is not authenticated', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            isAdmin: jest.fn(() => false),
            hasEditorialRole: jest.fn(() => false),
        });

        renderRoute();

        const navigate = screen.getByTestId('navigate');
        expect(navigate).toHaveAttribute('data-to', '/login');
    });

    test('allows admin users regardless of editorial role', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'admin-user' },
            loading: false,
            isAdmin: jest.fn(() => true),
            hasEditorialRole: jest.fn(() => false),
        });

        renderRoute();

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('allows users with approved editorial role', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'news-editor' },
            loading: false,
            isAdmin: jest.fn(() => false),
            hasEditorialRole: jest.fn((role) => role === 'News'),
        });

        renderRoute();

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('redirects unauthorized users to coming soon', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'standard-user' },
            loading: false,
            isAdmin: jest.fn(() => false),
            hasEditorialRole: jest.fn(() => false),
        });

        renderRoute();

        const navigate = screen.getByTestId('navigate');
        expect(navigate).toHaveAttribute('data-to', '/coming-soon');
    });
});
