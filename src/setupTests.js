// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ href, children, ...rest }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
    useParams: jest.fn(() => ({})),
    usePathname: jest.fn(() => window.location.pathname),
    useRouter: jest.fn(() => ({
        back: jest.fn(),
        push: jest.fn(),
        replace: jest.fn(),
    })),
    useSearchParams: jest.fn(() => new URLSearchParams(window.location.search)),
}));

const originalConsoleError = console.error;

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation((...args) => {
        const [message] = args;
        const isReactActDeprecationWarning =
            typeof message === 'string' &&
            message.includes('ReactDOMTestUtils.act') &&
            message.includes('deprecated in favor of `React.act`');

        if (isReactActDeprecationWarning) {
            return;
        }

        originalConsoleError(...args);
    });
});

afterAll(() => {
    if (console.error.mockRestore) {
        console.error.mockRestore();
    }
});

if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'scrollTo', {
        writable: true,
        value: jest.fn(),
    });
}
