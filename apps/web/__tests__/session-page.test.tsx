import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'sess1' }),
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
  api: {
    get: jest.fn().mockResolvedValue({ data: { data: [] } }),
    post: jest.fn().mockResolvedValue({ data: { _id: 'conv1' } }),
  },
}));

jest.mock('../src/lib/socket', () => ({
  createChatSocket: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  getUserIdFromToken: jest.fn(() => 'user1'),
}));

import SessionPage from '../src/app/(app)/session/[id]/page';

const baseSession = {
  id: 'sess1',
  type: 'chat',
  status: 'active',
  ratePerMin: 20,
  totalDurationSec: 0,
  totalAmount: 0,
  userId: 'user1',
  providerId: 'prov1',
};

describe('SessionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
    render(<SessionPage />);
    expect(screen.getByText('Loading session...')).toBeInTheDocument();
  });

  it('shows not found when no session', () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false });
    render(<SessionPage />);
    expect(screen.getByText('Session not found.')).toBeInTheDocument();
  });

  it('renders session type and status badge', () => {
    mockUseQuery.mockReturnValue({ data: baseSession, isLoading: false });
    render(<SessionPage />);
    expect(screen.getByText(/chat/i)).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders rate per minute', () => {
    mockUseQuery.mockReturnValue({ data: baseSession, isLoading: false });
    render(<SessionPage />);
    expect(screen.getByText('₹20.00/min')).toBeInTheDocument();
  });

  it('shows End Session button for active session', () => {
    mockUseQuery.mockReturnValue({ data: baseSession, isLoading: false });
    render(<SessionPage />);
    expect(screen.getByRole('button', { name: 'End Session' })).toBeInTheDocument();
  });

  it('shows call notice for active voice session (not chat)', () => {
    mockUseQuery.mockReturnValue({ data: { ...baseSession, type: 'voice' }, isLoading: false });
    render(<SessionPage />);
    expect(screen.getByText(/Voice.*active via Agora/i)).toBeInTheDocument();
  });

  it('renders duration when session has elapsed time', () => {
    mockUseQuery.mockReturnValue({
      data: { ...baseSession, totalDurationSec: 125 },
      isLoading: false,
    });
    render(<SessionPage />);
    expect(screen.getByText('2m 5s')).toBeInTheDocument();
  });

  it('renders total amount when non-zero', () => {
    mockUseQuery.mockReturnValue({
      data: { ...baseSession, totalAmount: 42.5 },
      isLoading: false,
    });
    render(<SessionPage />);
    expect(screen.getByText('₹42.50')).toBeInTheDocument();
  });

  it('shows Back to Home button for completed session', () => {
    mockUseQuery.mockReturnValue({
      data: { ...baseSession, status: 'completed' },
      isLoading: false,
    });
    render(<SessionPage />);
    expect(screen.getByRole('button', { name: 'Back to Home' })).toBeInTheDocument();
  });

  it('does not show End Session button for completed session', () => {
    mockUseQuery.mockReturnValue({
      data: { ...baseSession, status: 'completed' },
      isLoading: false,
    });
    render(<SessionPage />);
    expect(screen.queryByRole('button', { name: 'End Session' })).not.toBeInTheDocument();
  });

  it('shows end reason when present', () => {
    mockUseQuery.mockReturnValue({
      data: { ...baseSession, status: 'completed', endReason: 'user_ended' },
      isLoading: false,
    });
    render(<SessionPage />);
    expect(screen.getByText('user ended')).toBeInTheDocument();
  });
});
