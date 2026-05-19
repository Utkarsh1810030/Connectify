import { render, screen } from '@testing-library/react';
import AppLayout from '../src/app/(app)/layout';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('next/link', () => {
  const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
  Link.displayName = 'Link';
  return Link;
});

describe('AppLayout sidebar navigation', () => {
  beforeEach(() => {
    render(<AppLayout><div data-testid="content">content</div></AppLayout>);
  });

  it('renders children', () => {
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('logo link points to /home (not /(app)/home)', () => {
    const logo = screen.getByRole('link', { name: /connectify/i });
    expect(logo).toHaveAttribute('href', '/home');
  });

  it('Home nav link points to /home', () => {
    const link = screen.getByRole('link', { name: /🏠 home/i });
    expect(link).toHaveAttribute('href', '/home');
  });

  it('Wallet nav link points to /wallet (not /(app)/wallet)', () => {
    const link = screen.getByRole('link', { name: /💰 wallet/i });
    expect(link).toHaveAttribute('href', '/wallet');
  });

  it('no nav links contain route group prefix /(app)/', () => {
    screen.getAllByRole('link').forEach((link) => {
      expect(link.getAttribute('href')).not.toContain('/(app)/');
    });
  });
});
