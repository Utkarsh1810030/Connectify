import { getUserIdFromToken, createChatSocket } from '../src/lib/socket';

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

const { io } = require('socket.io-client');

describe('socket utility', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getUserIdFromToken', () => {
    it('returns null when no token in localStorage', () => {
      expect(getUserIdFromToken()).toBeNull();
    });

    it('decodes JWT payload and returns sub field', () => {
      const payload = { sub: 'user123', phone: '9999999999' };
      const encoded = btoa(JSON.stringify(payload));
      localStorage.setItem('access_token', `header.${encoded}.sig`);
      expect(getUserIdFromToken()).toBe('user123');
    });

    it('returns null when token is malformed', () => {
      localStorage.setItem('access_token', 'not.a.token');
      expect(getUserIdFromToken()).toBeNull();
    });
  });

  describe('createChatSocket', () => {
    it('creates socket connected to /chat namespace', () => {
      createChatSocket();
      expect(io).toHaveBeenCalledWith(
        expect.stringContaining('/chat'),
        expect.objectContaining({ autoConnect: false }),
      );
    });

    it('passes userId in auth when token available', () => {
      const payload = { sub: 'user42' };
      localStorage.setItem('access_token', `h.${btoa(JSON.stringify(payload))}.s`);
      createChatSocket();
      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ auth: { userId: 'user42' } }),
      );
    });

    it('passes null userId in auth when no token', () => {
      createChatSocket();
      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ auth: { userId: null } }),
      );
    });
  });
});
