import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockApiPost = jest.fn();
jest.mock('../src/lib/api', () => ({
  api: { post: (...args: unknown[]) => mockApiPost(...args) },
}));

import LoginPage from '../src/app/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders the phone step by default', () => {
    render(<LoginPage />);
    expect(screen.getByText('Connectify')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+91XXXXXXXXXX')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send OTP' })).toBeInTheDocument();
  });

  it('redirects to /home when already logged in', () => {
    localStorage.setItem('access_token', 'tok');
    render(<LoginPage />);
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });

  it('advances to OTP step after successful phone submit', async () => {
    mockApiPost.mockResolvedValue({ data: {} });
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('+91XXXXXXXXXX'), { target: { value: '9999999999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await waitFor(() => expect(screen.getByPlaceholderText('6-digit OTP')).toBeInTheDocument());
  });

  it('shows error message on failed OTP request', async () => {
    mockApiPost.mockRejectedValue({ response: { data: { message: 'Too many requests' } } });
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('+91XXXXXXXXXX'), { target: { value: '9999999999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await waitFor(() => expect(screen.getByText('Too many requests')).toBeInTheDocument());
  });

  it('stores tokens and redirects on successful OTP verify', async () => {
    mockApiPost
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { accessToken: 'at', refreshToken: 'rt' } });

    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('+91XXXXXXXXXX'), { target: { value: '9999999999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await waitFor(() => screen.getByPlaceholderText('6-digit OTP'));

    fireEvent.change(screen.getByPlaceholderText('6-digit OTP'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify OTP' }));

    await waitFor(() => expect(localStorage.getItem('access_token')).toBe('at'));
    expect(localStorage.getItem('refresh_token')).toBe('rt');
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });

  it('shows error message on failed OTP verify', async () => {
    mockApiPost
      .mockResolvedValueOnce({ data: {} })
      .mockRejectedValueOnce({ response: { data: { message: 'Invalid OTP' } } });

    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('+91XXXXXXXXXX'), { target: { value: '9999999999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await waitFor(() => screen.getByPlaceholderText('6-digit OTP'));

    fireEvent.change(screen.getByPlaceholderText('6-digit OTP'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify OTP' }));
    await waitFor(() => expect(screen.getByText('Invalid OTP')).toBeInTheDocument());
  });

  it('returns to phone step when "Change number" is clicked', async () => {
    mockApiPost.mockResolvedValue({ data: {} });
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('+91XXXXXXXXXX'), { target: { value: '9999999999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await waitFor(() => screen.getByPlaceholderText('6-digit OTP'));
    fireEvent.click(screen.getByRole('button', { name: 'Change number' }));
    expect(screen.getByPlaceholderText('+91XXXXXXXXXX')).toBeInTheDocument();
  });
});
