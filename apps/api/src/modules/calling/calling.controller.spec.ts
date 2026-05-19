import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallingController } from './calling.controller';
import { CallingService } from './calling.service';
import { SessionsService } from '../sessions/sessions.service';

const mockCallingService = {
  generateToken: jest.fn(),
  createChannel: jest.fn(),
};

const mockSessionsService = {
  findById: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('test-app-id'),
};

const mockUser = { id: 'user1' };

describe('CallingController', () => {
  let controller: CallingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CallingController],
      providers: [
        { provide: CallingService, useValue: mockCallingService },
        { provide: SessionsService, useValue: mockSessionsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<CallingController>(CallingController);
    jest.clearAllMocks();
  });

  describe('getToken', () => {
    it('throws NotFoundException when session not found', async () => {
      mockSessionsService.findById.mockResolvedValue(null);
      await expect(controller.getToken(mockUser, 'sess1')).rejects.toThrow(NotFoundException);
    });

    it('uses existing agoraChannelId when session has one', async () => {
      const session = { id: 'sess1', userId: 'user1', providerId: 'prov1', agoraChannelId: 'existing_channel' };
      mockSessionsService.findById.mockResolvedValue(session);
      mockCallingService.generateToken.mockResolvedValue('tok123');

      const result = await controller.getToken(mockUser, 'sess1');

      expect(mockCallingService.createChannel).not.toHaveBeenCalled();
      expect(mockCallingService.generateToken).toHaveBeenCalledWith('existing_channel', 'user1', 'publisher');
      expect(result).toMatchObject({ token: 'tok123', channelId: 'existing_channel', appId: 'test-app-id', uid: 0 });
    });

    it('creates a new channel when session has no agoraChannelId', async () => {
      const session = { id: 'sess1', userId: 'user1', providerId: 'prov1', agoraChannelId: null };
      mockSessionsService.findById.mockResolvedValue(session);
      mockCallingService.createChannel.mockResolvedValue('new_channel');
      mockCallingService.generateToken.mockResolvedValue('tok456');

      const result = await controller.getToken(mockUser, 'sess1');

      expect(mockCallingService.createChannel).toHaveBeenCalledWith('sess1');
      expect(result.channelId).toBe('new_channel');
      expect(result.token).toBe('tok456');
    });

    it('returns appId from config', async () => {
      const session = { id: 'sess1', userId: 'user1', providerId: 'prov1', agoraChannelId: 'ch1' };
      mockSessionsService.findById.mockResolvedValue(session);
      mockCallingService.generateToken.mockResolvedValue('tok');
      mockConfigService.get.mockReturnValue('my-agora-app-id');

      const result = await controller.getToken(mockUser, 'sess1');
      expect(result.appId).toBe('my-agora-app-id');
    });
  });
});
