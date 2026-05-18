import { render, screen } from '@testing-library/react';
import AdminLayout from '../src/app/(admin)/layout';

jest.mock('next/link', () => {
  const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
  Link.displayName = 'Link';
  return Link;
});

describe('AdminLayout sidebar navigation', () => {
  beforeEach(() => {
    render(<AdminLayout><div data-testid="content">content</div></AdminLayout>);
  });

  it('renders children', () => {
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders the Admin Panel heading', () => {
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('Users link points to /admin/users', () => {
    const link = screen.getByRole('link', { name: /👥 users/i });
    expect(link).toHaveAttribute('href', '/admin/users');
  });

  it('Payouts link points to /admin/payouts', () => {
    const link = screen.getByRole('link', { name: /💸 payouts/i });
    expect(link).toHaveAttribute('href', '/admin/payouts');
  });

  it('Moderation link points to /admin/moderation', () => {
    const link = screen.getByRole('link', { name: /🛡️ moderation/i });
    expect(link).toHaveAttribute('href', '/admin/moderation');
  });
});
