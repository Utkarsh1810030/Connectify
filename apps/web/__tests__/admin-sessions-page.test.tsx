import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
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

import AdminSessionsPage from '../src/app/(admin)/admin/sessions/page';

const mockSessions = {
  data: [
    { id: 's1', type: 'chat', status: 'completed', ratePerMin: 20, totalDurationSec: 120, totalAmount: 40, startedAt: new Date().toISOString() },
    { id: 's2', type: 'voice', status: 'active', ratePerMin: 35, totalDurationSec: 0, totalAmount: 0, startedAt: null },
  ],
  total: 2,
};

describe('AdminSessionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('shows empty state when no sessions', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
    render(<AdminSessionsPage />);
    expect(screen.getByText('No sessions yet.')).toBeInTheDocument();
  });

  it('renders sessions table', () => {
    mockUseQuery.mockReturnValue({ data: mockSessions, isLoading: false });
    render(<AdminSessionsPage />);
    expect(screen.getByText('chat')).toBeInTheDocument();
    expect(screen.getByText('voice')).toBeInTheDocument();
  });

  it('renders session statuses', () => {
    mockUseQuery.mockReturnValue({ data: mockSessions, isLoading: false });
    render(<AdminSessionsPage />);
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('shows page title', () => {
    mockUseQuery.mockReturnValue({ data: mockSessions, isLoading: false });
    render(<AdminSessionsPage />);
    expect(screen.getByText('Sessions')).toBeInTheDocument();
  });
});
