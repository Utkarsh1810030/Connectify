import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

const mockRatingsService = {
  create: jest.fn(),
  findByProvider: jest.fn(),
  findBySession: jest.fn(),
};

describe('RatingsController', () => {
  let controller: RatingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingsController],
      providers: [{ provide: RatingsService, useValue: mockRatingsService }],
    }).compile();

    controller = module.get<RatingsController>(RatingsController);
    jest.clearAllMocks();
  });

  it('create delegates with userId from CurrentUser', () => {
    const dto = { sessionId: 'sess1', score: 5 };
    controller.create({ id: 'user1' }, dto);
    expect(mockRatingsService.create).toHaveBeenCalledWith('user1', dto);
  });

  it('findByProvider passes parsed pagination', () => {
    controller.findByProvider('prov1', '2', '10');
    expect(mockRatingsService.findByProvider).toHaveBeenCalledWith('prov1', { page: 2, limit: 10 });
  });

  it('findByProvider passes undefined pagination when absent', () => {
    controller.findByProvider('prov1');
    expect(mockRatingsService.findByProvider).toHaveBeenCalledWith('prov1', { page: undefined, limit: undefined });
  });

  it('findBySession delegates to ratingsService.findBySession', () => {
    controller.findBySession('sess1');
    expect(mockRatingsService.findBySession).toHaveBeenCalledWith('sess1');
  });
});
