import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminRoute from './AdminRoute';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('./RedirectTo.jsx', () => ({ href }) => <div data-testid="navigate" data-to={href} />);

const mockUseAuth = useAuth;

const renderRoute = () =>
    render(
        <AdminRoute>
            <div>Admin Content</div>
        </AdminRoute>
    );

describe('AdminRoute', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('keeps checking permissions while auth/profile state is loading', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'admin-user' },
            loading: true,
            isAdmin: jest.fn(() => false),
        });

        renderRoute();

        expect(screen.getByText('Checking permissions...')).toBeInTheDocument();
        expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    test('redirects unauthenticated users to login after loading resolves', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            isAdmin: jest.fn(() => false),
        });

        renderRoute();

        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });

    test('allows admin users after loading resolves', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'admin-user' },
            loading: false,
            isAdmin: jest.fn(() => true),
        });

        renderRoute();

        expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    test('redirects non-admin users after loading resolves', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'standard-user' },
            loading: false,
            isAdmin: jest.fn(() => false),
        });

        renderRoute();

        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/coming-soon');
    });
});
