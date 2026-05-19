import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';

const mockUsersService = {
  findById: jest.fn(),
  update: jest.fn(),
  updateFcmToken: jest.fn(),
};

const mockUser = { id: 'user1', phone: '+911234567890' } as unknown as UserEntity;

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(require('../auth/guards/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('getMe returns the current user', () => {
    expect(controller.getMe(mockUser)).toBe(mockUser);
  });

  it('updateMe delegates to usersService.update', async () => {
    mockUsersService.update.mockResolvedValue({ ...mockUser, name: 'Alice' });
    const result = await controller.updateMe(mockUser, { name: 'Alice' });
    expect(mockUsersService.update).toHaveBeenCalledWith('user1', { name: 'Alice' });
    expect(result.name).toBe('Alice');
  });

  it('updateDeviceToken calls updateFcmToken and returns success', async () => {
    mockUsersService.updateFcmToken.mockResolvedValue(undefined);
    const result = await controller.updateDeviceToken(mockUser, 'fcm-xyz');
    expect(mockUsersService.updateFcmToken).toHaveBeenCalledWith('user1', 'fcm-xyz');
    expect(result).toEqual({ success: true });
  });
});
