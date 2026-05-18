import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { FeatureFlagsService } from './feature-flags.service';

@Module({
  imports: [CacheModule],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
