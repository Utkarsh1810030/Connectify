import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ModerationService } from './moderation.service';
import { ModerationLogEntity } from './entities/moderation-log.entity';
import { ReportEntity } from './entities/report.entity';
import { ContentFilterService } from './content-filter.service';
import { EVENT_BUS } from '../../infrastructure/event-bus/event-bus.interface';

const mockLogRepo = { create: jest.fn(), save: jest.fn(), count: jest.fn() };
const mockReportRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOneOrFail: jest.fn(),
  update: jest.fn(),
};
const mockFilter = { filter: jest.fn() };
const mockEventBus = { emit: jest.fn() };

describe('ModerationService', () => {
  let service: ModerationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: getRepositoryToken(ModerationLogEntity), useValue: mockLogRepo },
        { provide: getRepositoryToken(ReportEntity), useValue: mockReportRepo },
        { provide: ContentFilterService, useValue: mockFilter },
        { provide: EVENT_BUS, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
    jest.clearAllMocks();
  });

  describe('moderateMessage', () => {
    it('returns isClean when filter passes', async () => {
      mockFilter.filter.mockReturnValue({ isClean: true, matches: [], filteredContent: 'hello' });
      const result = await service.moderateMessage('sess1', 'user1', 'hello');
      expect(result).toEqual({ isClean: true, filteredContent: 'hello' });
      expect(mockLogRepo.save).not.toHaveBeenCalled();
    });

    it('logs violation and returns filtered content when match found', async () => {
      mockFilter.filter.mockReturnValue({ isClean: false, matches: ['phone'], filteredContent: '***' });
      mockLogRepo.create.mockReturnValue({});
      mockLogRepo.save.mockResolvedValue({});
      mockLogRepo.count.mockResolvedValue(1);

      const result = await service.moderateMessage('sess1', 'user1', '9876543210');
      expect(result).toEqual({ isClean: false, filteredContent: '***' });
      expect(mockLogRepo.save).toHaveBeenCalled();
    });

    it('emits ban event when violation threshold reached', async () => {
      mockFilter.filter.mockReturnValue({ isClean: false, matches: ['phone'], filteredContent: '***' });
      mockLogRepo.create.mockReturnValue({});
      mockLogRepo.save.mockResolvedValue({});
      mockLogRepo.count.mockResolvedValue(3);

      await service.moderateMessage('sess1', 'user1', '9876543210');
      expect(mockEventBus.emit).toHaveBeenCalledWith('moderation.ban_user', { userId: 'user1', reason: 'repeated_violations' });
    });
  });

  describe('reportUser', () => {
    it('creates and saves report with reporterId', async () => {
      const dto = { reportedUserId: 'user2', reason: 'spam', sessionId: null, description: null };
      const entity = { id: 'rep1', ...dto, reporterId: 'user1' };
      mockReportRepo.create.mockReturnValue(entity);
      mockReportRepo.save.mockResolvedValue(entity);

      const result = await service.reportUser(dto as any, 'user1');
      expect(mockReportRepo.create).toHaveBeenCalledWith({ ...dto, reporterId: 'user1' });
      expect(result).toEqual(entity);
    });
  });

  describe('getReports', () => {
    it('returns paginated reports', async () => {
      mockReportRepo.findAndCount.mockResolvedValue([[{ id: 'r1' }], 1]);
      const result = await service.getReports({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by status when provided', async () => {
      mockReportRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getReports({ status: 'open' });
      expect(mockReportRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'open' } }),
      );
    });
  });

  describe('updateReport', () => {
    it('updates status and returns updated entity', async () => {
      const updated = { id: 'rep1', status: 'resolved' };
      mockReportRepo.update.mockResolvedValue({});
      mockReportRepo.findOneOrFail.mockResolvedValue(updated);

      const result = await service.updateReport('rep1', 'resolved');
      expect(mockReportRepo.update).toHaveBeenCalledWith('rep1', { status: 'resolved' });
      expect(result).toEqual(updated);
    });
  });
});
