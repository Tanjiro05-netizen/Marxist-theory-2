import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StudyPathAI from './StudyPathAI';
import { supabase } from '../../supabaseClient';

jest.mock('../../supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

const props = {
  milestones: [
    {
      id: 'milestone-1',
      title: 'Capital Reading Block',
      description: 'Read the opening chapters.',
      resource_id: 'resource-1',
    },
  ],
  resources: [
    {
      id: 'resource-1',
      title: 'Capital Volume I',
      type: 'text',
      author: 'Karl Marx',
      category: 'Political Economy',
      digital_library_book_id: 'book-1',
    },
  ],
  userProgress: {},
};

const askAssistant = async (prompt = 'What should I read next?') => {
  fireEvent.click(screen.getByRole('button', { name: /ai assistant/i }));
  fireEvent.change(screen.getByPlaceholderText(/ask about the next milestone/i), {
    target: { value: prompt },
  });
  fireEvent.click(screen.getByRole('button', { name: /send/i }));
};

describe('StudyPathAI', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders cited source chips returned by the Study AI function', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: {
        reply: 'Start with the first chapter of Capital. [S1]',
        provider: 'DeepSeek',
        model: 'deepseek-v4-pro',
        sources: [
          {
            marker: 'S1',
            title: 'Capital Volume I',
            type: 'study_resource',
            href: '/book/book-1',
          },
        ],
      },
      error: null,
    });

    render(<StudyPathAI {...props} />);
    await askAssistant();

    expect(await screen.findByText(/Start with the first chapter/i)).toBeInTheDocument();

    const sources = screen.getByLabelText('Sources used');
    expect(sources).toHaveTextContent('S1');
    expect(sources).toHaveTextContent('Capital Volume I');
    expect(screen.getByRole('link', { name: /S1 Capital Volume I/i })).toHaveAttribute('href', '/book/book-1');

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('study-ai-chat', {
        body: expect.objectContaining({
          messages: expect.any(Array),
          context: expect.objectContaining({
            resources: [
              expect.objectContaining({
                id: 'resource-1',
                title: 'Capital Volume I',
                category: 'Political Economy',
                digital_library_book_id: 'book-1',
              }),
            ],
          }),
        }),
      });
    });
  });

  test('keeps older plain AI replies working when no sources are returned', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: {
        reply: 'Follow the current study path in order.',
        provider: 'fallback',
      },
      error: null,
    });

    render(<StudyPathAI {...props} />);
    await askAssistant('What is my path?');

    expect(await screen.findByText('Follow the current study path in order.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Sources used')).not.toBeInTheDocument();
  });
});
