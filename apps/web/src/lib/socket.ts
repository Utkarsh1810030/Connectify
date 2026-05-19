import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1')
  .replace('/api/v1', '');

export function getUserIdFromToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).sub ?? null;
  } catch {
    return null;
  }
}

export function createChatSocket(): Socket {
  return io(`${SOCKET_URL}/chat`, {
    auth: { userId: getUserIdFromToken() },
    transports: ['websocket'],
    autoConnect: false,
  });
}
