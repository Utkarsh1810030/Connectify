import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationLogEntity } from './entities/moderation-log.entity';
import { ReportEntity } from './entities/report.entity';
import { ContentFilterService } from './content-filter.service';
import { ModerationService } from './moderation.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModerationLogEntity, ReportEntity])],
  providers: [ContentFilterService, ModerationService],
  exports: [ContentFilterService, ModerationService],
})
export class ModerationModule { }
