import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WalletEntity } from './entities/wallet.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { CACHE_SERVICE, CacheKeys, ICacheService } from '../../infrastructure/cache/cache.interface';
import { InsufficientBalanceException } from './exceptions/insufficient-balance.exception';
import { roundMoney } from '@connectify/utils';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletEntity) private readonly walletRepo: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity) private readonly txRepo: Repository<TransactionEntity>,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
    private readonly dataSource: DataSource,
  ) {}

  async getOrCreateWallet(userId: string): Promise<WalletEntity> {
    let wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) {
      wallet = this.walletRepo.create({ userId, balance: 0 });
      wallet = await this.walletRepo.save(wallet);
    }
    return wallet;
  }

  async getBalance(userId: string): Promise<number> {
    const cached = await this.cache.get<number>(CacheKeys.wallet(userId));
    if (cached !== null) return cached;
    const wallet = await this.getOrCreateWallet(userId);
    await this.cache.set(CacheKeys.wallet(userId), wallet.balance, 30);
    return wallet.balance;
  }

  async topUp(userId: string, amount: number, razorpayPaymentId: string): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      const wallet = await em.findOneOrFail(WalletEntity, { where: { userId }, lock: { mode: 'pessimistic_write' } });
      const newBalance = roundMoney(Number(wallet.balance) + amount);
      await em.update(WalletEntity, wallet.id, { balance: newBalance });
      await em.save(TransactionEntity, em.create(TransactionEntity, {
        walletId: wallet.id, type: 'topup', amount, balanceAfter: newBalance,
        referenceType: 'razorpay', referenceId: razorpayPaymentId,
        description: `Wallet top-up via Razorpay`,
      }));
    });
    await this.cache.del(CacheKeys.wallet(userId));
  }

  async debit(userId: string, amount: number, sessionId: string, description: string): Promise<number> {
    let newBalance: number;
    await this.dataSource.transaction(async (em) => {
      const wallet = await em.findOneOrFail(WalletEntity, { where: { userId }, lock: { mode: 'pessimistic_write' } });
      if (Number(wallet.balance) < amount) throw new InsufficientBalanceException();
      newBalance = roundMoney(Number(wallet.balance) - amount);
      await em.update(WalletEntity, wallet.id, { balance: newBalance });
      await em.save(TransactionEntity, em.create(TransactionEntity, {
        walletId: wallet.id, type: 'debit', amount, balanceAfter: newBalance,
        referenceType: 'session', referenceId: sessionId, description,
      }));
    });
    await this.cache.set(CacheKeys.wallet(userId), newBalance!, 30);
    return newBalance!;
  }

  async credit(userId: string, amount: number, sessionId: string, description: string): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      const wallet = await em.findOneOrFail(WalletEntity, { where: { userId }, lock: { mode: 'pessimistic_write' } });
      const newBalance = roundMoney(Number(wallet.balance) + amount);
      await em.update(WalletEntity, wallet.id, { balance: newBalance });
      await em.save(TransactionEntity, em.create(TransactionEntity, {
        walletId: wallet.id, type: 'earning', amount, balanceAfter: newBalance,
        referenceType: 'session', referenceId: sessionId, description,
      }));
    });
    await this.cache.del(CacheKeys.wallet(userId));
  }

  async getTransactions(userId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const wallet = await this.getOrCreateWallet(userId);
    const [data, total] = await this.txRepo.findAndCount({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const { buildPagination } = await import('@connectify/utils');
    return { data, ...buildPagination(page, limit, total) };
  }
}
