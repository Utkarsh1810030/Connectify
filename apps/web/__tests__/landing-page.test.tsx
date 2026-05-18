import { render, screen } from '@testing-library/react';
import LandingPage from '../src/app/page';

// Mock next/link to render <a> tags we can inspect
jest.mock('next/link', () => {
  const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
  Link.displayName = 'Link';
  return Link;
});

describe('LandingPage', () => {
  beforeEach(() => {
    render(<LandingPage />);
  });

  it('renders the brand name', () => {
    expect(screen.getByText('Connectify')).toBeInTheDocument();
  });

  it('"Get Started" nav link points to /home (not /(app)/home)', () => {
    const link = screen.getByRole('link', { name: /get started/i });
    expect(link).toHaveAttribute('href', '/home');
  });

  it('"Browse Companions" button points to /home (not /(app)/home)', () => {
    const link = screen.getByRole('link', { name: /browse companions/i });
    expect(link).toHaveAttribute('href', '/home');
  });

  it('"Pricing" nav link points to /pricing', () => {
    const link = screen.getByRole('link', { name: /^pricing$/i });
    expect(link).toHaveAttribute('href', '/pricing');
  });

  it('"See Pricing" button points to /pricing', () => {
    const link = screen.getByRole('link', { name: /see pricing/i });
    expect(link).toHaveAttribute('href', '/pricing');
  });

  it('does not contain any /(app)/ hrefs (route group leak)', () => {
    const allLinks = screen.getAllByRole('link');
    allLinks.forEach((link) => {
      expect(link.getAttribute('href')).not.toContain('/(app)/');
    });
  });

  it('renders hero title', () => {
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders all three feature cards', () => {
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Voice')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
  });
});
