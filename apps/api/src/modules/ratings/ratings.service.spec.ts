import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RatingsService } from './ratings.service';
import { RatingEntity } from './entities/rating.entity';
import { ProvidersService } from '../providers/providers.service';
import { SessionsService } from '../sessions/sessions.service';

const mockRepo = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockProvidersService = { updateRating: jest.fn() };
const mockSessionsService = { findById: jest.fn() };

describe('RatingsService', () => {
  let service: RatingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        { provide: getRepositoryToken(RatingEntity), useValue: mockRepo },
        { provide: ProvidersService, useValue: mockProvidersService },
        { provide: SessionsService, useValue: mockSessionsService },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const completedSession = { id: 'sess1', userId: 'user1', providerId: 'prov1', status: 'completed' };

    it('throws BadRequestException when user is not the session owner', async () => {
      mockSessionsService.findById.mockResolvedValue({ ...completedSession, userId: 'other' });
      await expect(service.create('user1', { sessionId: 'sess1', score: 5 })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when session not completed', async () => {
      mockSessionsService.findById.mockResolvedValue({ ...completedSession, status: 'active' });
      await expect(service.create('user1', { sessionId: 'sess1', score: 5 })).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when session already rated', async () => {
      mockSessionsService.findById.mockResolvedValue(completedSession);
      mockRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.create('user1', { sessionId: 'sess1', score: 5 })).rejects.toThrow(ConflictException);
    });

    it('creates rating and updates provider rating on success', async () => {
      mockSessionsService.findById.mockResolvedValue(completedSession);
      mockRepo.findOne.mockResolvedValue(null);
      const rating = { id: 'r1', score: 5, userId: 'user1', providerId: 'prov1' };
      mockRepo.create.mockReturnValue(rating);
      mockRepo.save.mockResolvedValue(rating);
      mockProvidersService.updateRating.mockResolvedValue(undefined);

      const result = await service.create('user1', { sessionId: 'sess1', score: 5 });

      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockProvidersService.updateRating).toHaveBeenCalledWith('prov1', 5);
      expect(result).toBe(rating);
    });
  });

  describe('findBySession', () => {
    it('returns rating when found', async () => {
      const rating = { id: 'r1', sessionId: 'sess1' };
      mockRepo.findOne.mockResolvedValue(rating);
      const result = await service.findBySession('sess1');
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { sessionId: 'sess1' } });
      expect(result).toBe(rating);
    });

    it('returns null when no rating exists', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.findBySession('sess1');
      expect(result).toBeNull();
    });
  });

  describe('findByProvider', () => {
    it('returns paginated results', async () => {
      mockRepo.findAndCount.mockResolvedValue([[{ id: 'r1' }], 1]);
      const result = await service.findByProvider('prov1', { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { providerId: 'prov1' }, take: 10, skip: 0 }),
      );
    });
  });
});
