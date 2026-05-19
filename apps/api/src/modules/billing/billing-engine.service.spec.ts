import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingEngineService } from './billing-engine.service';
import { WalletService } from './wallet.service';
import { EVENT_BUS } from '../../infrastructure/event-bus/event-bus.interface';
import { CACHE_SERVICE } from '../../infrastructure/cache/cache.interface';
import { ActiveSessionState } from '@connectify/types';

const mockWalletService = { debit: jest.fn(), credit: jest.fn() };
const mockConfig = { get: jest.fn().mockReturnValue(0.15) };
const mockEventBus = { emit: jest.fn(), on: jest.fn() };
const mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

const session: ActiveSessionState = {
  sessionId: 'sess1',
  userId: 'user1',
  providerId: 'prov1',
  type: 'voice',
  ratePerMin: 10,
  startedAt: Date.now() - 120_000,
  lastBilledAt: Date.now() - 60_000,
  agoraChannelId: null,
  agoraToken: null,
};

describe('BillingEngineService', () => {
  let service: BillingEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingEngineService,
        { provide: WalletService, useValue: mockWalletService },
        { provide: ConfigService, useValue: mockConfig },
        { provide: EVENT_BUS, useValue: mockEventBus },
        { provide: CACHE_SERVICE, useValue: mockCache },
      ],
    }).compile();

    service = module.get<BillingEngineService>(BillingEngineService);
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  describe('startBilling', () => {
    it('stores session in cache and starts a timer', async () => {
      mockCache.set.mockResolvedValue(undefined);
      await service.startBilling(session);
      expect(mockCache.set).toHaveBeenCalledWith(`session:active:${session.sessionId}`, session, expect.any(Number));
    });
  });

  describe('pauseBilling', () => {
    it('clears timer and charges partial minute', async () => {
      mockCache.set.mockResolvedValue(undefined);
      await service.startBilling(session);
      mockCache.get.mockResolvedValue({ ...session, lastBilledAt: Date.now() - 30_000 });
      mockWalletService.debit.mockResolvedValue(50);
      mockWalletService.credit.mockResolvedValue(undefined);

      await service.pauseBilling(session.sessionId);

      expect(mockWalletService.debit).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith(
        `session:active:${session.sessionId}`,
        expect.objectContaining({ pausedAt: expect.any(Number) }),
        expect.any(Number),
      );
    });

    it('does nothing when session not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      await service.pauseBilling('unknown-sess');
      expect(mockWalletService.debit).not.toHaveBeenCalled();
    });

    it('skips charge when elapsed < 10 seconds', async () => {
      mockCache.set.mockResolvedValue(undefined);
      await service.startBilling(session);
      mockCache.get.mockResolvedValue({ ...session, lastBilledAt: Date.now() - 5_000 });

      await service.pauseBilling(session.sessionId);
      expect(mockWalletService.debit).not.toHaveBeenCalled();
    });
  });

  describe('resumeBilling', () => {
    it('resets lastBilledAt and restarts timer', async () => {
      mockCache.get.mockResolvedValue({ ...session, pausedAt: Date.now() - 30_000 });
      mockCache.set.mockResolvedValue(undefined);

      await service.resumeBilling(session.sessionId);

      expect(mockCache.set).toHaveBeenCalledWith(
        `session:active:${session.sessionId}`,
        expect.objectContaining({ lastBilledAt: expect.any(Number), pausedAt: undefined }),
        expect.any(Number),
      );
    });

    it('does nothing when session not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      await service.resumeBilling('ghost-sess');
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  describe('stopBilling', () => {
    it('returns zero values when no session in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockCache.del.mockResolvedValue(undefined);
      const result = await service.stopBilling('ghost-sess');
      expect(result).toEqual({ totalSec: 0, totalAmount: 0 });
    });

    it('charges partial minute and returns totals', async () => {
      const now = Date.now();
      mockCache.get.mockResolvedValue({ ...session, startedAt: now - 90_000, lastBilledAt: now - 30_000 });
      mockCache.del.mockResolvedValue(undefined);
      mockWalletService.debit.mockResolvedValue(45);
      mockWalletService.credit.mockResolvedValue(undefined);

      const result = await service.stopBilling(session.sessionId);
      expect(result.totalSec).toBeGreaterThan(0);
      expect(result.totalAmount).toBeGreaterThan(0);
    });
  });
});
