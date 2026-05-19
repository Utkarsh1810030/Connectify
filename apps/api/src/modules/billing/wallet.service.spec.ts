import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WalletService } from './wallet.service';
import { WalletEntity } from './entities/wallet.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { PayoutEntity } from './entities/payout.entity';
import { CACHE_SERVICE } from '../../infrastructure/cache/cache.interface';

const mockWalletRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockTxRepo = { findAndCount: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockPayoutRepo = { findAndCount: jest.fn(), create: jest.fn(), save: jest.fn(), findOne: jest.fn() };
const mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
const mockDataSource = { transaction: jest.fn() };

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(WalletEntity), useValue: mockWalletRepo },
        { provide: getRepositoryToken(TransactionEntity), useValue: mockTxRepo },
        { provide: getRepositoryToken(PayoutEntity), useValue: mockPayoutRepo },
        { provide: CACHE_SERVICE, useValue: mockCache },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('returns cached balance without hitting DB', async () => {
      mockCache.get.mockResolvedValue(500);
      const result = await service.getBalance('user1');
      expect(result).toBe(500);
      expect(mockWalletRepo.findOne).not.toHaveBeenCalled();
    });

    it('falls through to DB and caches result on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      const wallet = { id: 'w1', userId: 'user1', balance: 200 };
      mockWalletRepo.findOne.mockResolvedValue(wallet);
      mockCache.set.mockResolvedValue(undefined);

      const result = await service.getBalance('user1');
      expect(result).toBe(200);
      expect(mockCache.set).toHaveBeenCalled();
    });
  });

  describe('getOrCreateWallet', () => {
    it('returns existing wallet when found', async () => {
      const wallet = { id: 'w1', userId: 'user1', balance: 100 };
      mockWalletRepo.findOne.mockResolvedValue(wallet);
      const result = await service.getOrCreateWallet('user1');
      expect(result).toBe(wallet);
      expect(mockWalletRepo.save).not.toHaveBeenCalled();
    });

    it('creates and saves wallet when not found', async () => {
      const newWallet = { id: 'w1', userId: 'user1', balance: 0 };
      mockWalletRepo.findOne.mockResolvedValue(null);
      mockWalletRepo.create.mockReturnValue(newWallet);
      mockWalletRepo.save.mockResolvedValue(newWallet);

      const result = await service.getOrCreateWallet('user1');
      expect(mockWalletRepo.save).toHaveBeenCalled();
      expect(result).toBe(newWallet);
    });
  });

  describe('requestPayout', () => {
    it('throws BadRequestException when balance insufficient', async () => {
      mockCache.get.mockResolvedValue(50);
      await expect(service.requestPayout('user1', 200)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when amount below minimum ₹100', async () => {
      mockCache.get.mockResolvedValue(500);
      await expect(service.requestPayout('user1', 50)).rejects.toThrow(BadRequestException);
    });

    it('creates payout when balance and amount are valid', async () => {
      mockCache.get.mockResolvedValue(500);
      mockPayoutRepo.findOne.mockResolvedValue(null);
      const payout = { id: 'pay1', amount: 200, status: 'pending' };
      mockPayoutRepo.create.mockReturnValue(payout);
      mockPayoutRepo.save.mockResolvedValue(payout);

      const result = await service.requestPayout('user1', 200);
      expect(mockPayoutRepo.save).toHaveBeenCalled();
      expect(result).toBe(payout);
    });

    it('throws BadRequestException when a pending payout already exists', async () => {
      mockCache.get.mockResolvedValue(500);
      mockPayoutRepo.findOne.mockResolvedValue({ id: 'pay0', status: 'pending' });
      await expect(service.requestPayout('user1', 200)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPayouts', () => {
    it('returns paginated payouts', async () => {
      mockPayoutRepo.findAndCount.mockResolvedValue([[{ id: 'pay1' }], 1]);
      const result = await service.getPayouts('user1', { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(mockPayoutRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { providerId: 'user1' }, take: 10, skip: 0 }),
      );
    });
  });
});
