import React from 'react';
import { render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import RedirectTo from './RedirectTo.jsx';

describe('RedirectTo', () => {
  test('uses router.push by default', () => {
    const push = jest.fn();
    const replace = jest.fn();
    useRouter.mockReturnValue({ push, replace, back: jest.fn() });

    render(<RedirectTo href="/login" />);

    expect(push).toHaveBeenCalledWith('/login');
    expect(replace).not.toHaveBeenCalled();
  });

  test('uses router.replace when requested', () => {
    const push = jest.fn();
    const replace = jest.fn();
    useRouter.mockReturnValue({ push, replace, back: jest.fn() });

    render(<RedirectTo href="/coming-soon" replace />);

    expect(replace).toHaveBeenCalledWith('/coming-soon');
    expect(push).not.toHaveBeenCalled();
  });
});
