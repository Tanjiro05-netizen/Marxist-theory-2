import { lockPageScroll } from './scrollLock';

describe('lockPageScroll', () => {
    const rootStyle = () => document.documentElement.style.overflow;

    it('locks the root element, not the body', () => {
        const unlock = lockPageScroll();
        expect(rootStyle()).toBe('hidden');
        expect(document.body.style.overflow).toBe('');
        unlock();
    });

    it('restores the previous overflow on release', () => {
        document.documentElement.style.overflow = 'clip';
        const unlock = lockPageScroll();
        expect(rootStyle()).toBe('hidden');
        unlock();
        expect(rootStyle()).toBe('clip');
        document.documentElement.style.overflow = '';
    });

    it('stays locked until every holder releases', () => {
        const first = lockPageScroll();
        const second = lockPageScroll();
        first();
        expect(rootStyle()).toBe('hidden');
        second();
        expect(rootStyle()).toBe('');
    });

    it('ignores a double release', () => {
        const unlock = lockPageScroll();
        unlock();
        unlock();
        expect(rootStyle()).toBe('');
    });
});
