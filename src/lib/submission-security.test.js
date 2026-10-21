jest.mock('server-only', () => ({}));

import { inspectPdfBytes } from './submission-security.js';

describe('submission PDF inspection', () => {
    test('accepts a PDF signature with a terminal EOF marker', () => {
        const bytes = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n');
        const result = inspectPdfBytes(bytes);

        expect(result.valid).toBe(true);
        expect(result.size).toBe(bytes.length);
        expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    });

    test('rejects a renamed non-PDF and a truncated PDF', () => {
        expect(inspectPdfBytes(Buffer.from('not a PDF')).valid).toBe(false);
        expect(inspectPdfBytes(Buffer.from('%PDF-1.7\n')).valid).toBe(false);
    });
});
