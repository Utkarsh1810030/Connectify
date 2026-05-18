export type SessionType = 'chat' | 'voice' | 'video';

export type SessionStatus =
  | 'pending'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type SessionEndReason =
  | 'user_ended'
  | 'provider_ended'
  | 'low_balance'
  | 'moderation'
  | 'timeout'
  | 'error';

export interface Session {
  id: string;
  userId: string;
  providerId: string;
  type: SessionType;
  status: SessionStatus;
  ratePerMin: number;
  totalDurationSec: number;
  totalAmount: number;
  platformFee: number;
  providerEarning: number;
  startedAt: Date | null;
  endedAt: Date | null;
  endReason: SessionEndReason | null;
  agoraChannelId: string | null;
  createdAt: Date;
}

export interface StartSessionDto {
  providerId: string;
  type: SessionType;
}

export interface ActiveSessionState {
  sessionId: string;
  userId: string;
  providerId: string;
  type: SessionType;
  ratePerMin: number;
  startedAt: number;
  lastBilledAt: number;
  agoraChannelId: string | null;
  agoraToken: string | null;
}
