import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PoliticsPage from './PoliticsPage';

describe('PoliticsPage', () => {
  test('filters visible articles by category', () => {
    render(<PoliticsPage />);

    expect(screen.getByRole('heading', { name: 'The Deepening Crisis of Imperialism' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Movements' }));

    expect(screen.queryByRole('heading', { name: 'The Deepening Crisis of Imperialism' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Labour Movement Resurgence in Southeast Asia' })).toBeInTheDocument();
  });

  test('filters visible articles by search text and preserves the first matching feature story', () => {
    render(<PoliticsPage />);

    fireEvent.change(screen.getByPlaceholderText('Search articles...'), {
      target: { value: 'berlin' },
    });

    expect(screen.getByRole('heading', { name: 'The Housing Struggle in Berlin' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Multipolarity and Class Struggle' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /The Housing Struggle in Berlin/i })).toHaveAttribute(
      'href',
      '/politics/housing-struggle-berlin'
    );
  });
});
