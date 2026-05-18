import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ICacheService } from './cache.interface';

@Injectable()
export class RedisCacheService implements ICacheService, OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(this.config.get<string>('REDIS_URL')!);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  // Expose raw client for advanced operations (billing timers, pub/sub)
  getClient(): Redis {
    return this.client;
  }
}
