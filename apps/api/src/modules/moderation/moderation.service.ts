import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModerationLogEntity } from './entities/moderation-log.entity';
import { ReportEntity } from './entities/report.entity';
import { ContentFilterService } from './content-filter.service';
import { EVENT_BUS, IEventBus } from '../../infrastructure/event-bus/event-bus.interface';
import { CreateReportDto } from './dto/create-report.dto';
import { getPaginationOffset, buildPagination } from '@connectify/utils';

const VIOLATION_THRESHOLD = 3;

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(ModerationLogEntity)
    private readonly logRepo: Repository<ModerationLogEntity>,
    @InjectRepository(ReportEntity)
    private readonly reportRepo: Repository<ReportEntity>,
    private readonly filter: ContentFilterService,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  async moderateMessage(
    sessionId: string,
    senderId: string,
    content: string,
  ): Promise<{ isClean: boolean; filteredContent: string }> {
    const result = this.filter.filter(content);
    if (result.isClean) return { isClean: true, filteredContent: content };

    const log = this.logRepo.create({
      sessionId,
      userId: senderId,
      type: 'keyword_match',
      content: result.matches.join(', '),
      actionTaken: 'blocked',
    });
    await this.logRepo.save(log);

    const violations = await this.logRepo.count({ where: { userId: senderId } });
    if (violations >= VIOLATION_THRESHOLD) {
      this.eventBus.emit('moderation.ban_user', { userId: senderId, reason: 'repeated_violations' });
    }

    return { isClean: false, filteredContent: result.filteredContent };
  }

  async reportUser(dto: CreateReportDto, reporterId: string): Promise<ReportEntity> {
    const report = this.reportRepo.create({ ...dto, reporterId });
    return this.reportRepo.save(report);
  }

  async getReports(query: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = query;
    const where: any = {};
    if (status) where.status = status;
    const [data, total] = await this.reportRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: getPaginationOffset(page, limit),
      take: limit,
    });
    return { data, ...buildPagination(page, limit, total) };
  }
}
