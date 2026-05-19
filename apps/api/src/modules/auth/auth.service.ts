import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { CACHE_SERVICE, ICacheService } from '../../infrastructure/cache/cache.interface';
import { UsersService } from '../users/users.service';
import { AuthTokens } from '@connectify/types';
import { isValidIndianPhone, normalizePhone } from '@connectify/utils';

@Injectable()
export class AuthService {
  private readonly OTP_TTL = 300; // 5 minutes
  private readonly OTP_RATE_LIMIT_TTL = 60; // 1 min between resends

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
  ) { }

  async requestOtp(phone: string): Promise<void> {
    if (!isValidIndianPhone(phone)) throw new BadRequestException('Invalid phone number');
    const normalized = normalizePhone(phone);
    const rateLimitKey = `ratelimit:otp:${normalized}`;
    if (await this.cache.exists(rateLimitKey)) {
      throw new BadRequestException('OTP already sent. Please wait before requesting again.');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.cache.set(`otp:${normalized}`, otp, this.OTP_TTL);
    await this.cache.set(rateLimitKey, '1', this.OTP_RATE_LIMIT_TTL);

    const authKey = this.config.get<string>('MSG91_AUTH_KEY');
    const templateId = this.config.get<string>('MSG91_TEMPLATE_ID');

    if (authKey && templateId) {
      await this.sendMsg91Otp(normalized, otp, authKey, templateId);
    } else {
      console.log(`[DEV] OTP for ${normalized}: ${otp}`);
    }
  }

  private async sendMsg91Otp(phone: string, otp: string, authKey: string, templateId: string): Promise<void> {
    const digits = phone.replace(/^\+/, '');
    const url = 'https://api.msg91.com/api/v5/otp';
    const payload = {
      template_id: templateId,
      mobile: digits,
      authkey: authKey,
      otp,
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`[MSG91] OTP send failed: ${response.status} ${body}`);
      // Don't throw — the OTP is cached; SMS failure shouldn't block auth
    }
  }

  async verifyOtp(phone: string, otp: string): Promise<AuthTokens> {
    const normalized = normalizePhone(phone);
    const stored = await this.cache.get<string>(`otp:${normalized}`);
    if (!stored || stored !== otp) throw new UnauthorizedException('Invalid or expired OTP');
    await this.cache.del(`otp:${normalized}`);
    const user = await this.usersService.upsertByPhone(normalized);
    return this.generateTokens(user.id, user.phone, user.role);
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      const blacklistKey = `blacklist:refresh:${token}`;
      if (await this.cache.exists(blacklistKey)) throw new UnauthorizedException();
      const user = await this.usersService.findById(payload.sub);
      if (!user || user.isBanned) throw new UnauthorizedException();
      return this.generateTokens(user.id, user.phone, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    // Blacklist the refresh token for its remaining TTL
    await this.cache.set(`blacklist:refresh:${refreshToken}`, '1', 60 * 60 * 24 * 30);
  }

  private generateTokens(userId: string, phone: string, role: string): AuthTokens {
    const payload = { sub: userId, phone, role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });
    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
