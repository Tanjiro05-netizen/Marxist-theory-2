import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import RoleManagementPage from './RoleManagementPage';
import { supabase } from '../../supabaseClient';

jest.mock('../../supabaseClient', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

const buildFetchProfilesQuery = (profiles) => {
    const query = {
        select: jest.fn(() => query),
        order: jest.fn().mockResolvedValue({ data: profiles, error: null }),
    };

    return query;
};

const buildUpdateProfileQuery = () => {
    const query = {
        update: jest.fn(() => query),
        eq: jest.fn().mockResolvedValue({ error: null }),
    };

    return query;
};

const buildAuditQuery = (rows = []) => {
    const query = {
        select: jest.fn(() => query),
        order: jest.fn(() => query),
        limit: jest.fn().mockResolvedValue({ data: rows, error: null }),
    };

    return query;
};

const mockRoleManagementSupabase = ({ profiles, auditRows = [] }) => {
    const fetchQuery = buildFetchProfilesQuery(profiles);
    const updateQuery = buildUpdateProfileQuery();
    const auditQuery = buildAuditQuery(auditRows);

    let didFetchProfiles = false;

    supabase.from.mockImplementation((tableName) => {
        if (tableName === 'profiles') {
            if (!didFetchProfiles) {
                didFetchProfiles = true;
                return fetchQuery;
            }

            return updateQuery;
        }

        if (tableName === 'profile_role_audit_log') {
            return auditQuery;
        }

        throw new Error(`Unexpected table: ${tableName}`);
    });

    return { fetchQuery, updateQuery, auditQuery };
};

describe('RoleManagementPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('shows dirty state and enables save after role edits', async () => {
        const profiles = [
            {
                id: 'member-1',
                username: 'Comrade One',
                role: 'user',
                is_certified: false,
                editorial_roles: [],
                expertise_roles: [],
                updated_at: '2026-03-03T12:00:00.000Z',
            },
        ];

        mockRoleManagementSupabase({ profiles });

        render(<RoleManagementPage />);

        await screen.findByText('Comrade One');

        expect(screen.getByRole('button', { name: 'No Changes' })).toBeDisabled();
        expect(screen.queryByText('1 profile with unsaved changes.')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'News' }));

        expect(await screen.findByText('1 profile with unsaved changes.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    });

    test('blocks demotion of the last admin account', async () => {
        const profiles = [
            {
                id: 'admin-1',
                username: 'Sole Admin',
                role: 'admin',
                is_certified: true,
                editorial_roles: ['News'],
                expertise_roles: [],
                updated_at: '2026-03-03T12:00:00.000Z',
            },
        ];

        const { updateQuery } = mockRoleManagementSupabase({ profiles });

        render(<RoleManagementPage />);

        await screen.findByText('Sole Admin');

        fireEvent.change(screen.getByDisplayValue('admin'), { target: { value: 'user' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

        expect(
            await screen.findByText('Cannot demote the last admin account. Promote another member first.')
        ).toBeInTheDocument();

        expect(updateQuery.update).not.toHaveBeenCalled();
    });

    test('persists changes and resets dirty state after successful save', async () => {
        const profiles = [
            {
                id: 'member-2',
                username: 'Comrade Two',
                role: 'user',
                is_certified: false,
                editorial_roles: [],
                expertise_roles: [],
                updated_at: '2026-03-03T12:00:00.000Z',
            },
        ];

        const { updateQuery } = mockRoleManagementSupabase({ profiles });

        render(<RoleManagementPage />);

        await screen.findByText('Comrade Two');

        fireEvent.click(screen.getByRole('button', { name: 'Writer' }));
        fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

        await waitFor(() => {
            expect(updateQuery.update).toHaveBeenCalled();
        });

        expect(updateQuery.update).toHaveBeenCalledWith(
            expect.objectContaining({
                role: 'user',
                editorial_roles: ['Writer'],
                expertise_roles: [],
                is_certified: false,
            })
        );

        expect(await screen.findByText('Saved roles for Comrade Two.')).toBeInTheDocument();
        expect(screen.queryByText('1 profile with unsaved changes.')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'No Changes' })).toBeDisabled();
    });

    test('bulk apply and save target only explicitly selected profiles', async () => {
        const profiles = [
            {
                id: 'member-1',
                username: 'Comrade One',
                role: 'user',
                is_certified: false,
                editorial_roles: [],
                expertise_roles: [],
                updated_at: '2026-03-03T12:00:00.000Z',
            },
            {
                id: 'member-2',
                username: 'Comrade Two',
                role: 'user',
                is_certified: false,
                editorial_roles: [],
                expertise_roles: [],
                updated_at: '2026-03-03T12:05:00.000Z',
            },
        ];

        const { updateQuery } = mockRoleManagementSupabase({ profiles });

        render(<RoleManagementPage />);

        const rowOneHeading = await screen.findByText('Comrade One');
        await screen.findByText('Comrade Two');

        const rowOne = rowOneHeading.closest('article');
        const rowTwo = screen.getByText('Comrade Two').closest('article');
        const bulkPanel = screen.getByText('Bulk role actions').closest('section');

        fireEvent.click(within(rowOne).getByLabelText('Select profile'));

        fireEvent.change(within(bulkPanel).getByDisplayValue('user'), {
            target: { value: 'admin' },
        });
        fireEvent.click(within(bulkPanel).getAllByRole('button', { name: 'Apply to selected' })[0]);

        expect(within(rowOne).getByDisplayValue('admin')).toBeInTheDocument();
        expect(within(rowTwo).getByDisplayValue('user')).toBeInTheDocument();

        fireEvent.click(within(bulkPanel).getByRole('button', { name: 'Save selected (1)' }));

        await waitFor(() => {
            expect(updateQuery.update).toHaveBeenCalledTimes(1);
        });

        expect(updateQuery.eq).toHaveBeenCalledWith('id', 'member-1');
        expect(updateQuery.eq).not.toHaveBeenCalledWith('id', 'member-2');
        expect(updateQuery.update).toHaveBeenCalledWith(
            expect.objectContaining({
                role: 'admin',
            })
        );
    });
});
