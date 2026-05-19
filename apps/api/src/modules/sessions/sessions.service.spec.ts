import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionEntity } from './entities/session.entity';
import { ProvidersService } from '../providers/providers.service';
import { BillingEngineService } from '../billing/billing-engine.service';
import { WalletService } from '../billing/wallet.service';
import { CallingService } from '../calling/calling.service';
import { EVENT_BUS } from '../../infrastructure/event-bus/event-bus.interface';
import { CACHE_SERVICE } from '../../infrastructure/cache/cache.interface';
import { ConfigService } from '@nestjs/config';

const mockRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), update: jest.fn(), findAndCount: jest.fn() };
const mockProvidersService = { findById: jest.fn() };
const mockBillingEngine = {
  startBilling: jest.fn(),
  stopBilling: jest.fn(),
  pauseBilling: jest.fn(),
  resumeBilling: jest.fn(),
};
const mockWalletService = { getBalance: jest.fn() };
const mockCallingService = { createChannel: jest.fn(), generateToken: jest.fn(), endChannel: jest.fn() };
const mockEventBus = { emit: jest.fn(), on: jest.fn() };
const mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
const mockConfig = { get: jest.fn().mockReturnValue(0.15) };

const activeSession = {
  id: 'sess1', userId: 'user1', providerId: 'prov1',
  type: 'voice', status: 'active', ratePerMin: 10, agoraChannelId: null,
};
const pausedSession = { ...activeSession, status: 'paused' };

describe('SessionsService', () => {
  let service: SessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: getRepositoryToken(SessionEntity), useValue: mockRepo },
        { provide: ProvidersService, useValue: mockProvidersService },
        { provide: BillingEngineService, useValue: mockBillingEngine },
        { provide: WalletService, useValue: mockWalletService },
        { provide: CallingService, useValue: mockCallingService },
        { provide: EVENT_BUS, useValue: mockEventBus },
        { provide: CACHE_SERVICE, useValue: mockCache },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    jest.clearAllMocks();
  });

  describe('pause', () => {
    it('pauses an active session and stops billing timer', async () => {
      mockRepo.findOne.mockResolvedValueOnce(activeSession).mockResolvedValueOnce({ ...activeSession, status: 'paused' });
      mockBillingEngine.pauseBilling.mockResolvedValue(undefined);

      const result = await service.pause('sess1', 'user1');

      expect(mockBillingEngine.pauseBilling).toHaveBeenCalledWith('sess1');
      expect(mockRepo.update).toHaveBeenCalledWith('sess1', { status: 'paused' });
      expect(mockEventBus.emit).toHaveBeenCalledWith('session.paused', { sessionId: 'sess1', userId: 'user1' });
      expect(result.status).toBe('paused');
    });

    it('throws when session is not active', async () => {
      mockRepo.findOne.mockResolvedValue({ ...activeSession, status: 'completed' });
      await expect(service.pause('sess1', 'user1')).rejects.toThrow(BadRequestException);
    });

    it('throws when userId is not a participant', async () => {
      mockRepo.findOne.mockResolvedValue(activeSession);
      await expect(service.pause('sess1', 'stranger')).rejects.toThrow(BadRequestException);
    });

    it('allows provider to pause the session', async () => {
      mockRepo.findOne.mockResolvedValueOnce(activeSession).mockResolvedValueOnce({ ...activeSession, status: 'paused' });
      mockBillingEngine.pauseBilling.mockResolvedValue(undefined);
      await service.pause('sess1', 'prov1');
      expect(mockBillingEngine.pauseBilling).toHaveBeenCalled();
    });
  });

  describe('resume', () => {
    it('resumes a paused session and restarts billing', async () => {
      mockRepo.findOne.mockResolvedValueOnce(pausedSession).mockResolvedValueOnce({ ...pausedSession, status: 'active' });
      mockBillingEngine.resumeBilling.mockResolvedValue(undefined);

      const result = await service.resume('sess1', 'user1');

      expect(mockBillingEngine.resumeBilling).toHaveBeenCalledWith('sess1');
      expect(mockRepo.update).toHaveBeenCalledWith('sess1', { status: 'active' });
      expect(mockEventBus.emit).toHaveBeenCalledWith('session.resumed', { sessionId: 'sess1', userId: 'user1' });
      expect(result.status).toBe('active');
    });

    it('throws when session is not paused', async () => {
      mockRepo.findOne.mockResolvedValue(activeSession);
      await expect(service.resume('sess1', 'user1')).rejects.toThrow(BadRequestException);
    });

    it('throws when userId is not a participant', async () => {
      mockRepo.findOne.mockResolvedValue(pausedSession);
      await expect(service.resume('sess1', 'stranger')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when session missing', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
