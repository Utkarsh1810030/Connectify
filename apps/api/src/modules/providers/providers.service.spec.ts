import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProvidersService } from './providers.service';
import { ProviderProfileEntity } from './entities/provider-profile.entity';
import { CACHE_SERVICE } from '../../infrastructure/cache/cache.interface';

const mockRepo = {
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
};
const mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

describe('ProvidersService', () => {
  let service: ProvidersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        { provide: getRepositoryToken(ProviderProfileEntity), useValue: mockRepo },
        { provide: CACHE_SERVICE, useValue: mockCache },
      ],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('executes weighted ranking query and returns paginated results', async () => {
      const qbMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'p1' }], 1]),
      };
      mockRepo.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.list({ page: 1, limit: 10 });

      expect(qbMock.where).toHaveBeenCalledWith('p.is_approved = true');
      expect(qbMock.orderBy).toHaveBeenCalledWith(
        expect.stringContaining('avg_rating'),
        'DESC',
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('adds category filter when provided', async () => {
      const qbMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockRepo.createQueryBuilder.mockReturnValue(qbMock);

      await service.list({ category: 'career_advice' });
      expect(qbMock.andWhere).toHaveBeenCalledWith(':cat = ANY(p.categories)', { cat: 'career_advice' });
    });
  });

  describe('submitKyc', () => {
    it('sets status to pending and stores document URL', async () => {
      const profile = { id: 'p1', userId: 'u1', kycStatus: 'not_submitted' };
      mockRepo.findOne.mockResolvedValueOnce(profile).mockResolvedValueOnce({ ...profile, kycStatus: 'pending' });

      const result = await service.submitKyc('u1', 'https://cdn.example.com/doc.pdf');

      expect(mockRepo.update).toHaveBeenCalledWith('p1', {
        kycStatus: 'pending',
        kycDocumentUrl: 'https://cdn.example.com/doc.pdf',
        kycRejectionReason: null,
      });
      expect(result.kycStatus).toBe('pending');
    });

    it('throws ConflictException when KYC already approved', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'p1', userId: 'u1', kycStatus: 'approved' });
      await expect(service.submitKyc('u1', 'https://url')).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when no profile found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.submitKyc('u1', 'https://url')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reviewKyc', () => {
    it('sets kycStatus to approved and clears rejection reason', async () => {
      const updated = { id: 'p1', kycStatus: 'approved', kycRejectionReason: null };
      mockRepo.findOneOrFail.mockResolvedValue(updated);

      const result = await service.reviewKyc('p1', 'approved');

      expect(mockRepo.update).toHaveBeenCalledWith('p1', { kycStatus: 'approved', kycRejectionReason: null });
      expect(result.kycStatus).toBe('approved');
    });

    it('stores rejection reason when rejecting', async () => {
      mockRepo.findOneOrFail.mockResolvedValue({ id: 'p1', kycStatus: 'rejected', kycRejectionReason: 'Blurry' });

      await service.reviewKyc('p1', 'rejected', 'Blurry');

      expect(mockRepo.update).toHaveBeenCalledWith('p1', {
        kycStatus: 'rejected',
        kycRejectionReason: 'Blurry',
      });
    });
  });

  describe('updateRating', () => {
    it('computes rolling average and increments totalRatings', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'p1', avgRating: 4.0, totalRatings: 2 });
      await service.updateRating('p1', 5);
      expect(mockRepo.update).toHaveBeenCalledWith('p1', {
        avgRating: 4.33,
        totalRatings: 3,
      });
    });

    it('does nothing when provider not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await service.updateRating('bad-id', 5);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('updateOnlineStatus', () => {
    it('sets isOnline and caches when going online', async () => {
      await service.updateOnlineStatus('u1', true);
      expect(mockRepo.update).toHaveBeenCalledWith({ userId: 'u1' }, { isOnline: true });
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('removes from cache when going offline', async () => {
      await service.updateOnlineStatus('u1', false);
      expect(mockCache.del).toHaveBeenCalled();
    });
  });
});
