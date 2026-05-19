import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { CACHE_SERVICE, CacheKeys, ICacheService } from '../cache/cache.interface';

// Matches the feature_flags table
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
}

// Injected as a simple entity — TypeORM entity defined in postgres/entities
@Injectable()
export class FeatureFlagsService implements OnModuleInit {
  constructor(
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
  ) { }

  // On startup, warm the cache from DB (done by the module that has DB access)
  onModuleInit() { }

  async isEnabled(key: string): Promise<boolean> {
    const cached = await this.cache.get<boolean>(CacheKeys.featureFlag(key));
    if (cached !== null) return cached;
    // Default to false — DB layer sets cache on startup and writes
    return false;
  }

  async set(key: string, enabled: boolean): Promise<void> {
    await this.cache.set(CacheKeys.featureFlag(key), enabled, 60);
  }
}
