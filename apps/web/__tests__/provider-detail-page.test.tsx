import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'prov1' }),
  useRouter: () => ({ push: jest.fn() }),
}));

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

jest.mock('../src/lib/api', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

import ProviderDetailPage from '../src/app/(app)/provider/[id]/page';

const mockProvider = {
  id: 'prov1',
  displayName: 'Alice',
  bio: 'Here to help',
  avgRating: 4.8,
  totalSessions: 50,
  languages: ['English', 'Hindi'],
  categories: ['emotional_support', 'career_advice'],
  chatRatePerMin: 20,
  voiceRatePerMin: 35,
  videoRatePerMin: 50,
  isOnline: true,
  isApproved: true,
};

describe('ProviderDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<ProviderDetailPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows not found on error', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ProviderDetailPage />);
    expect(screen.getByText('Provider not found.')).toBeInTheDocument();
  });

  it('renders provider name and bio', () => {
    mockUseQuery.mockReturnValue({ data: mockProvider, isLoading: false, isError: false });
    render(<ProviderDetailPage />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Here to help')).toBeInTheDocument();
  });

  it('renders provider rating, sessions, and languages', () => {
    mockUseQuery.mockReturnValue({ data: mockProvider, isLoading: false, isError: false });
    render(<ProviderDetailPage />);
    expect(screen.getByText(/4\.8/)).toBeInTheDocument();
    expect(screen.getByText(/50 sessions/)).toBeInTheDocument();
    expect(screen.getByText(/English/)).toBeInTheDocument();
  });

  it('renders category tags', () => {
    mockUseQuery.mockReturnValue({ data: mockProvider, isLoading: false, isError: false });
    render(<ProviderDetailPage />);
    expect(screen.getByText('emotional support')).toBeInTheDocument();
    expect(screen.getByText('career advice')).toBeInTheDocument();
  });

  it('renders all three session start buttons when online', () => {
    mockUseQuery.mockReturnValue({ data: mockProvider, isLoading: false, isError: false });
    render(<ProviderDetailPage />);
    expect(screen.getByRole('button', { name: /Chat/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voice Call/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Video Call/ })).toBeInTheDocument();
  });

  it('shows offline message instead of action buttons when provider offline', () => {
    mockUseQuery.mockReturnValue({
      data: { ...mockProvider, isOnline: false },
      isLoading: false,
      isError: false,
    });
    render(<ProviderDetailPage />);
    expect(screen.getByText('This provider is currently offline.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Chat/ })).not.toBeInTheDocument();
  });

  it('displays rates per minute', () => {
    mockUseQuery.mockReturnValue({ data: mockProvider, isLoading: false, isError: false });
    render(<ProviderDetailPage />);
    expect(screen.getByText('₹20')).toBeInTheDocument();
    expect(screen.getByText('₹35')).toBeInTheDocument();
    expect(screen.getByText('₹50')).toBeInTheDocument();
  });
});
