import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventBusModule } from './event-bus/event-bus.module';
import { CacheModule } from './cache/cache.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';

@Global()
@Module({
  imports: [ConfigModule, EventBusModule, CacheModule, FeatureFlagsModule],
  exports: [EventBusModule, CacheModule, FeatureFlagsModule],
})
export class InfrastructureModule { }
