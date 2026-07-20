import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import SubstackPage from './SubstackPage';
import SubstackReaderPage, { sanitizeArticleHtml } from './SubstackReaderPage';
import { loadSubstackPosts } from '../services/substackApi';

jest.mock('../services/substackApi', () => ({
  SUBSTACK_AUTHOR_PROFILE_URL: 'https://substack.com/@leninistwarrior',
  SUBSTACK_PUBLICATION_URL: 'https://acc2049.substack.com',
  cleanSubstackContentHtml: jest.requireActual('../services/substackApi').cleanSubstackContentHtml,
  loadSubstackPosts: jest.fn(),
}));

const source = {
  title: '☭/Acc’s Substack',
  url: 'https://acc2049.substack.com',
  authorName: '☭/Acc',
  authorProfileUrl: 'https://substack.com/@leninistwarrior',
};

const posts = [
  {
    id: '1',
    slug: 'the-realm-of-freedom',
    title: 'The Realm of Freedom',
    url: 'https://acc2049.substack.com/p/the-realm-of-freedom',
    publishedAt: '2026-04-29T18:15:00.000Z',
    author: '☭/Acc',
    excerpt: 'What do we do when the struggle for survival ends?',
    contentHtml:
      '<p>Native content with <a href="https://example.com/source">a source</a>.</p><p>☭/Acc’s Substack is a reader-supported publication. To receive new posts and support my work, consider becoming a free or paid subscriber.</p><div class="subscription-widget-wrap"><input type="email" placeholder="Type your email…" /><button>Subscribe</button></div><script>alert("x")</script>',
    imageUrl: 'https://example.com/freedom.jpg',
    categories: ['Personal'],
  },
  {
    id: '2',
    slug: 'a-short-note-on-fascism-ii',
    title: 'A short note on Fascism II',
    url: 'https://acc2049.substack.com/p/a-short-note-on-fascism-ii',
    publishedAt: '2026-03-10T12:00:00.000Z',
    author: '☭/Acc',
    excerpt: 'Continuing directly where we left off',
    contentHtml: '<p>Second post.</p>',
    imageUrl: '',
    categories: ['Short Notes'],
  },
  {
    id: '3',
    slug: 'the-doctrine-of-negation',
    title: 'The Doctrine of Negation',
    url: 'https://acc2049.substack.com/p/the-doctrine-of-negation',
    publishedAt: '2025-12-28T12:00:00.000Z',
    author: '☭/Acc',
    excerpt: 'Why Communism is a Subtracting Force, Not a Blueprint',
    contentHtml: '<p>Third post.</p>',
    imageUrl: 'https://example.com/negation.jpg',
    categories: ['Theory'],
  },
  {
    id: '4',
    slug: 'what-if-it-the-last',
    title: 'What if it the last?',
    url: 'https://acc2049.substack.com/p/what-if-it-the-last',
    publishedAt: '2025-12-19T12:00:00.000Z',
    author: '☭/Acc',
    excerpt: 'The scene is a high ridge.',
    contentHtml: '<p>Fourth post.</p>',
    imageUrl: '',
    categories: ['Personal'],
  },
  {
    id: '5',
    slug: 'technical-overview-of-invariance',
    title: 'Technical Overview: On the Invariance of Theory',
    url: 'https://acc2049.substack.com/p/technical-overview-of-invariance',
    publishedAt: '2025-10-04T12:00:00.000Z',
    author: '☭/Acc',
    excerpt: 'On the structural persistence of revolutionary theory.',
    contentHtml: '<p>Fifth post.</p>',
    imageUrl: '',
    categories: ['Foundations of Science'],
  },
  {
    id: '6',
    slug: 'a-short-note-on-fascism',
    title: 'A Short Note: On Fascism',
    url: 'https://acc2049.substack.com/p/a-short-note-on-fascism',
    publishedAt: '2025-09-21T12:00:00.000Z',
    author: '☭/Acc',
    excerpt: 'Nothing more than another Bourgeois Method of Rule',
    contentHtml: '<p>Sixth post.</p>',
    imageUrl: '',
    categories: ['Short Notes'],
  },
];
const mockUseParams = useParams;

describe('SubstackPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Substack posts and filters by search text', async () => {
    loadSubstackPosts.mockResolvedValue({ source, posts });

    render(<SubstackPage />);

    expect(await screen.findByRole('heading', { name: 'The Realm of Freedom' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A short note on Fascism II' })).toBeInTheDocument();
    expect(screen.getByLabelText('Featured Substack article')).toHaveTextContent('The Realm of Freedom');
    expect(screen.getByLabelText('Recent Substack articles')).toHaveTextContent('A short note on Fascism II');
    expect(screen.getByLabelText('Most Popular')).toHaveTextContent('The Doctrine of Negation');

    fireEvent.change(screen.getByPlaceholderText('Search Substack articles...'), {
      target: { value: 'fascism' },
    });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'The Realm of Freedom' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'A short note on Fascism II' })).toBeInTheDocument();
  });

  test('renders a native reader page with sanitized article HTML and safe outbound links', async () => {
    loadSubstackPosts.mockResolvedValue({ source, posts });
    mockUseParams.mockReturnValue({ slug: 'the-realm-of-freedom' });

    const { container } = render(<SubstackReaderPage />);

    expect(await screen.findByRole('heading', { name: 'The Realm of Freedom' })).toBeInTheDocument();
    expect(container.innerHTML).not.toContain('<script>');
    expect(screen.queryByText(/reader-supported publication/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/type your email/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument();

    const outboundLink = screen.getByRole('link', { name: 'a source' });
    expect(outboundLink).toHaveAttribute('target', '_blank');
    expect(outboundLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('sanitizes the empty initial reader render without browser-only assumptions', () => {
    expect(sanitizeArticleHtml('')).toBe('');
  });
});
