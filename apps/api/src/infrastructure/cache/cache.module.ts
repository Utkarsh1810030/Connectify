import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisCacheService } from './redis-cache.service';
import { CACHE_SERVICE } from './cache.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    RedisCacheService,
    { provide: CACHE_SERVICE, useExisting: RedisCacheService },
  ],
  exports: [CACHE_SERVICE, RedisCacheService],
})
export class CacheModule { }
