const mockRangeResult = jest.fn();

jest.mock('../../../supabaseClient', () => ({
    supabase: {
        from: jest.fn(() => {
            const chain = {};
            const state = { select: '' };
            ['eq', 'is', 'in', 'not', 'order', 'ilike'].forEach((method) => {
                chain[method] = jest.fn(() => chain);
            });
            chain.select = jest.fn((selectArg) => {
                state.select = selectArg;
                return chain;
            });
            chain.range = jest.fn(() => mockRangeResult(state.select));
            chain.single = jest.fn(() => mockRangeResult(state.select));
            return chain;
        }),
    },
}));

const { socialApiService } = require('./index');

const PROFILES_DENIED = { data: null, count: 0, error: { code: '42501', message: 'permission denied for table profiles' } };

describe('socialApiService profile-embed fallback', () => {
    beforeEach(() => {
        mockRangeResult.mockReset();
    });

    test('retries the timeline without profiles when the anon role is denied', async () => {
        mockRangeResult.mockImplementation((selectArg) => (
            selectArg.includes('author:profiles')
                ? PROFILES_DENIED
                : { data: [{ id: 'p1', content: 'hello' }], count: 1, error: null }
        ));

        const page = await socialApiService.getTimeline({ mode: 'home', userId: 'dev-admin', page: 1, limit: 20 });

        expect(mockRangeResult).toHaveBeenCalledTimes(2);
        expect(page.total).toBe(1);
        expect(page.data[0].id).toBe('p1');
    });

    test('non-permission errors still surface', async () => {
        mockRangeResult.mockReturnValue({ data: null, count: 0, error: { code: 'XX000', message: 'boom' } });

        let caught = null;
        await socialApiService.getTimeline({ mode: 'hot', userId: 'dev-admin' }).catch((e) => { caught = e; });

        expect(caught).toEqual({ code: 'XX000', message: 'boom' });
        expect(mockRangeResult).toHaveBeenCalledTimes(1);
    });

    test('following mode skips the query entirely for a non-UUID user id', async () => {
        const page = await socialApiService.getTimeline({ mode: 'following', userId: 'dev-admin' });

        expect(page.data).toEqual([]);
        expect(mockRangeResult).not.toHaveBeenCalled();
    });
});
