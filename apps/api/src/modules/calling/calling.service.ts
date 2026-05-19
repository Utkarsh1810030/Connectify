import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { CACHE_SERVICE, CacheKeys, ICacheService } from '../../infrastructure/cache/cache.interface';

const TOKEN_EXPIRY_SEC = 3600;

@Injectable()
export class CallingService {
  constructor(
    private readonly config: ConfigService,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
  ) { }

  async generateToken(channelId: string, userId: string, role: 'publisher' | 'subscriber'): Promise<string> {
    const cacheKey = CacheKeys.agoraToken(channelId, userId);
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    const appId = this.config.get<string>('AGORA_APP_ID')!;
    const cert = this.config.get<string>('AGORA_APP_CERTIFICATE')!;
    const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SEC;

    const token = RtcTokenBuilder.buildTokenWithUid(appId, cert, channelId, 0, agoraRole, expiresAt, expiresAt);
    await this.cache.set(cacheKey, token, TOKEN_EXPIRY_SEC - 60);
    return token;
  }

  async createChannel(sessionId: string): Promise<string> {
    return `connectify_${sessionId.replace(/-/g, '')}`;
  }

  async endChannel(channelId: string): Promise<void> {
    // Clean up cached tokens for this channel
    // In production with Agora Cloud Recording, kick all participants here
  }
}
