import { render, screen } from '@testing-library/react';

const mockUseQuery = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('../src/lib/api', () => ({
  api: { get: jest.fn().mockResolvedValue({ data: { data: [] } }) },
}));

jest.mock('next/link', () => {
  const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
  Link.displayName = 'Link';
  return Link;
});

import HomePage from '../src/app/(app)/home/page';

describe('HomePage', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: { data: [] }, isLoading: false });
  });

  it('renders the page heading', () => {
    render(<HomePage />);
    expect(screen.getByText('Find a Companion')).toBeInTheDocument();
  });

  it('shows empty state when no providers', () => {
    render(<HomePage />);
    expect(screen.getByText('No companions available right now.')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
    render(<HomePage />);
    expect(screen.queryByText('No companions available right now.')).not.toBeInTheDocument();
  });

  it('renders provider cards with correct link hrefs', () => {
    mockUseQuery.mockReturnValue({
      data: {
        data: [
          { id: 'p1', displayName: 'Alice', bio: 'Caring', chatRatePerMin: 20, avgRating: 4.5, isOnline: true, categories: [] },
          { id: 'p2', displayName: 'Bob', bio: null, chatRatePerMin: 15, avgRating: 4.0, isOnline: false, categories: [] },
        ],
      },
      isLoading: false,
    });

    render(<HomePage />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    const aliceLink = screen.getByRole('link', { name: /alice/i });
    expect(aliceLink).toHaveAttribute('href', '/provider/p1');
  });

  it('displays provider rate and rating', () => {
    mockUseQuery.mockReturnValue({
      data: {
        data: [{ id: 'p1', displayName: 'Alice', bio: 'Hello', chatRatePerMin: 25, avgRating: 4.8, isOnline: true, categories: [] }],
      },
      isLoading: false,
    });
    render(<HomePage />);
    expect(screen.getByText('₹25/min')).toBeInTheDocument();
    expect(screen.getByText(/4\.8/)).toBeInTheDocument();
  });
});
