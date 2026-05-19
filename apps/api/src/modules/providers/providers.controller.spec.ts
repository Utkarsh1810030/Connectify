import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { UserEntity } from '../users/entities/user.entity';

const mockProvidersService = {
  list: jest.fn(),
  findByUserId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateOnlineStatus: jest.fn(),
};

const mockUser = { id: 'user1', phone: '9999999999', role: 'provider' } as unknown as UserEntity;

describe('ProvidersController', () => {
  let controller: ProvidersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvidersController],
      providers: [{ provide: ProvidersService, useValue: mockProvidersService }],
    }).compile();

    controller = module.get<ProvidersController>(ProvidersController);
    jest.clearAllMocks();
  });

  it('list passes category and parsed pagination', () => {
    controller.list('career_advice', '1', '20');
    expect(mockProvidersService.list).toHaveBeenCalledWith({ category: 'career_advice', page: 1, limit: 20 });
  });

  it('list passes undefined values when params absent', () => {
    controller.list();
    expect(mockProvidersService.list).toHaveBeenCalledWith({ category: undefined, page: undefined, limit: undefined });
  });

  it('getMyProfile fetches by userId from token', () => {
    controller.getMyProfile(mockUser);
    expect(mockProvidersService.findByUserId).toHaveBeenCalledWith('user1');
  });

  it('findOne fetches by param id', () => {
    controller.findOne('prov1');
    expect(mockProvidersService.findById).toHaveBeenCalledWith('prov1');
  });

  it('create passes userId and dto', () => {
    const dto = { displayName: 'Alice', categories: ['chat'], languages: ['English'], chatRatePerMin: 20, voiceRatePerMin: 30, videoRatePerMin: 40 };
    controller.create(mockUser, dto as any);
    expect(mockProvidersService.create).toHaveBeenCalledWith('user1', dto);
  });

  it('update passes userId and dto', () => {
    const dto = { displayName: 'Alice Updated' };
    controller.update(mockUser, dto as any);
    expect(mockProvidersService.update).toHaveBeenCalledWith('user1', dto);
  });

  it('toggleOnline passes userId and boolean', () => {
    controller.toggleOnline(mockUser, true);
    expect(mockProvidersService.updateOnlineStatus).toHaveBeenCalledWith('user1', true);
  });

  it('toggleOnline handles offline toggle', () => {
    controller.toggleOnline(mockUser, false);
    expect(mockProvidersService.updateOnlineStatus).toHaveBeenCalledWith('user1', false);
  });
});
