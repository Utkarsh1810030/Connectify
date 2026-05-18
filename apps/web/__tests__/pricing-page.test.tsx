import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Pricing page tests — page must exist and render correctly
describe('PricingPage', () => {
  it('pricing page module exists', () => {
    // This will throw if the file does not exist
    expect(() => require('../src/app/pricing/page')).not.toThrow();
  });

  it('renders without crashing', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PricingPage = require('../src/app/pricing/page').default;
    expect(() => render(<PricingPage />)).not.toThrow();
  });

  it('has a heading', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PricingPage = require('../src/app/pricing/page').default;
    render(<PricingPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
