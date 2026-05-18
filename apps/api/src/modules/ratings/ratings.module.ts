import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingEntity } from './entities/rating.entity';
import { RatingsService } from './ratings.service';
import { ProvidersModule } from '../providers/providers.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [TypeOrmModule.forFeature([RatingEntity]), ProvidersModule, SessionsModule],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
