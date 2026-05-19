import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQueryClient = jest.fn(() => ({ invalidateQueries: jest.fn() }));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock('../src/lib/api', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

import ProviderDashboardPage from '../src/app/(provider)/dashboard/page';

const mockProfile = {
  displayName: 'Alice',
  totalSessions: 12,
  totalMinutes: 240,
  avgRating: 4.7,
  chatRatePerMin: 20,
  isOnline: true,
};

const mockSessions = {
  data: [
    { id: 's1', type: 'chat', status: 'completed', totalAmount: 40, createdAt: new Date().toISOString() },
  ],
};

describe('ProviderDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
    render(<ProviderDashboardPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders provider name', () => {
    mockUseQuery
      .mockReturnValueOnce({ data: mockProfile, isLoading: false })
      .mockReturnValueOnce({ data: null, isLoading: false })
      .mockReturnValueOnce({ data: mockSessions, isLoading: false });
    render(<ProviderDashboardPage />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it('renders session and minute stats', () => {
    mockUseQuery
      .mockReturnValueOnce({ data: mockProfile, isLoading: false })
      .mockReturnValueOnce({ data: null, isLoading: false })
      .mockReturnValueOnce({ data: mockSessions, isLoading: false });
    render(<ProviderDashboardPage />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('240')).toBeInTheDocument();
  });

  it('renders avg rating', () => {
    mockUseQuery
      .mockReturnValueOnce({ data: mockProfile, isLoading: false })
      .mockReturnValueOnce({ data: null, isLoading: false })
      .mockReturnValueOnce({ data: mockSessions, isLoading: false });
    render(<ProviderDashboardPage />);
    expect(screen.getByText(/4\.7/)).toBeInTheDocument();
  });

  it('renders KYC approved badge', () => {
    mockUseQuery
      .mockReturnValueOnce({ data: mockProfile, isLoading: false })
      .mockReturnValueOnce({ data: { kycStatus: 'approved' }, isLoading: false })
      .mockReturnValueOnce({ data: mockSessions, isLoading: false });
    render(<ProviderDashboardPage />);
    expect(screen.getByText('KYC Verified')).toBeInTheDocument();
  });

  it('renders KYC pending badge', () => {
    mockUseQuery
      .mockReturnValueOnce({ data: mockProfile, isLoading: false })
      .mockReturnValueOnce({ data: { kycStatus: 'pending' }, isLoading: false })
      .mockReturnValueOnce({ data: mockSessions, isLoading: false });
    render(<ProviderDashboardPage />);
    expect(screen.getByText('KYC Pending Review')).toBeInTheDocument();
  });

  it('renders KYC not submitted badge when no kyc data', () => {
    mockUseQuery
      .mockReturnValueOnce({ data: mockProfile, isLoading: false })
      .mockReturnValueOnce({ data: { kycStatus: 'not_submitted' }, isLoading: false })
      .mockReturnValueOnce({ data: mockSessions, isLoading: false });
    render(<ProviderDashboardPage />);
    expect(screen.getByText('KYC Not Submitted')).toBeInTheDocument();
  });
});
