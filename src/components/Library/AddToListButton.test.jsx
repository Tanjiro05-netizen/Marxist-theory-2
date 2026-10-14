import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddToListButton from './AddToListButton';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'library.addToList': 'Add to list',
        'library.localListsNote': 'Saved on this device',
        'library.noLists': 'No lists yet',
        'library.listName': 'List name',
        'library.createAndAddToList': 'Create and add to list',
      };
      return translations[key] || key;
    },
  }),
}));

describe('AddToListButton', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('creates a new list and adds the current book to it', async () => {
    render(<AddToListButton bookId="book-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Add to list' }));
    await userEvent.type(screen.getByPlaceholderText('List name'), 'Theory');
    await userEvent.click(screen.getByRole('button', { name: 'Create and add to list' }));

    const saved = JSON.parse(localStorage.getItem('marxist_reading_lists'));
    expect(saved).toEqual([
      expect.objectContaining({
        name: 'Theory',
        bookIds: ['book-1'],
      }),
    ]);
    expect(screen.getByText('Theory')).toBeInTheDocument();
  });

  test('exposes expanded state and closes on Escape', async () => {
    render(<AddToListButton bookId="book-1" />);

    const trigger = screen.getByRole('button', { name: 'Add to list' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
