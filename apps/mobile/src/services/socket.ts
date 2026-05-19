import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import type { Message } from '@connectify/types';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl?.replace('/api/v1', '') ?? 'http://localhost:3000';

class SocketService {
  private chatSocket: Socket | null = null;
  private sessionSocket: Socket | null = null;

  async connect() {
    const token = await SecureStore.getItemAsync('access_token');
    const opts = { auth: { token }, transports: ['websocket'] as string[] };

    this.chatSocket = io(`${BASE_URL}/chat`, opts);
    this.sessionSocket = io(`${BASE_URL}/session`, opts);

    this.chatSocket.on('connect_error', (err) => console.warn('[socket] chat error:', err.message));
    this.sessionSocket.on('connect_error', (err) => console.warn('[socket] session error:', err.message));
  }

  disconnect() {
    this.chatSocket?.disconnect();
    this.sessionSocket?.disconnect();
    this.chatSocket = null;
    this.sessionSocket = null;
  }

  joinConversation(sessionId: string) {
    this.chatSocket?.emit('join_conversation', { sessionId });
  }

  leaveConversation(sessionId: string) {
    this.chatSocket?.off('new_message');
  }

  sendMessage(sessionId: string, content: string) {
    this.chatSocket?.emit('send_message', { sessionId, content });
  }

  sendTyping(sessionId: string, isTyping: boolean) {
    this.chatSocket?.emit('typing', { sessionId, isTyping });
  }

  onNewMessage(cb: (msg: Message) => void) {
    this.chatSocket?.on('new_message', cb);
  }

  onTyping(cb: (data: { userId: string; isTyping: boolean }) => void) {
    this.chatSocket?.on('typing', cb);
  }

  onSessionRequest(cb: (data: { sessionId: string; type: string; ratePerMin: number }) => void) {
    this.sessionSocket?.on('session_request', cb);
  }

  offSessionRequest() {
    this.sessionSocket?.off('session_request');
  }

  onSessionAccepted(cb: (data: { sessionId: string }) => void) {
    this.sessionSocket?.on('session_accepted', cb);
  }

  onSessionDeclined(cb: (data: { sessionId: string }) => void) {
    this.sessionSocket?.on('session_declined', cb);
  }

  onSessionCancelled(cb: (data: { sessionId: string; reason: string }) => void) {
    this.sessionSocket?.on('session_cancelled', cb);
  }

  emitAcceptSession(sessionId: string) {
    this.sessionSocket?.emit('accept_session', { sessionId });
  }

  emitDeclineSession(sessionId: string) {
    this.sessionSocket?.emit('decline_session', { sessionId });
  }

  onLowBalance(cb: () => void) {
    this.sessionSocket?.on('low_balance_warning', cb);
  }

  emitPauseSession(sessionId: string) {
    this.sessionSocket?.emit('pause_session', { sessionId });
  }

  emitResumeSession(sessionId: string) {
    this.sessionSocket?.emit('resume_session', { sessionId });
  }

  onSessionEnd(cb: () => void) {
    this.sessionSocket?.on('session_ended', cb);
  }

  onSessionPaused(cb: () => void) {
    this.sessionSocket?.on('session_paused', cb);
  }

  onSessionResumed(cb: () => void) {
    this.sessionSocket?.on('session_resumed', cb);
  }
}

export const socketService = new SocketService();
