export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export const CACHE_SERVICE = Symbol('CACHE_SERVICE');

export const CacheKeys = {
  featureFlag: (key: string) => `ff:${key}`,
  wallet: (userId: string) => `wallet:${userId}`,
  providerOnline: (userId: string) => `presence:${userId}`,
  activeSession: (sessionId: string) => `session:active:${sessionId}`,
  rateLimitOtp: (phone: string) => `ratelimit:otp:${phone}`,
  agoraToken: (channelId: string, userId: string) => `agora:token:${channelId}:${userId}`,
} as const;
