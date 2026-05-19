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

import ProviderSettingsPage from '../src/app/(provider)/settings/page';

const mockProfile = {
  displayName: 'Alice',
  bio: 'I help people.',
  chatRatePerMin: 20,
  voiceRatePerMin: 35,
  videoRatePerMin: 50,
  languages: ['English', 'Hindi'],
  categories: ['emotional_support'],
  isOnline: true,
};

describe('ProviderSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false });
  });

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
    render(<ProviderSettingsPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows no profile found state when data is null', () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false });
    render(<ProviderSettingsPage />);
    expect(screen.getByText('No provider profile found.')).toBeInTheDocument();
  });

  it('renders settings form with profile data', () => {
    mockUseQuery.mockReturnValue({ data: mockProfile, isLoading: false });
    render(<ProviderSettingsPage />);
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('I help people.')).toBeInTheDocument();
  });

  it('shows online status button', () => {
    mockUseQuery.mockReturnValue({ data: mockProfile, isLoading: false });
    render(<ProviderSettingsPage />);
    expect(screen.getByRole('button', { name: /Online/i })).toBeInTheDocument();
  });

  it('shows offline status when provider is offline', () => {
    mockUseQuery.mockReturnValue({ data: { ...mockProfile, isOnline: false }, isLoading: false });
    render(<ProviderSettingsPage />);
    expect(screen.getByRole('button', { name: /Offline/i })).toBeInTheDocument();
  });

  it('renders Save Changes button', () => {
    mockUseQuery.mockReturnValue({ data: mockProfile, isLoading: false });
    render(<ProviderSettingsPage />);
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });

  it('renders rate fields with correct values', () => {
    mockUseQuery.mockReturnValue({ data: mockProfile, isLoading: false });
    render(<ProviderSettingsPage />);
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    expect(screen.getByDisplayValue('35')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });

  it('renders language chips', () => {
    mockUseQuery.mockReturnValue({ data: mockProfile, isLoading: false });
    render(<ProviderSettingsPage />);
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hindi' })).toBeInTheDocument();
  });
});
