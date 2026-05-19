import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { EVENT_BUS, IEventBus } from '../../infrastructure/event-bus/event-bus.interface';
import { CACHE_SERVICE, ICacheService } from '../../infrastructure/cache/cache.interface';
import { ActiveSessionState } from '@connectify/types';
import { splitAmount, roundMoney } from '@connectify/utils';

const BILLING_INTERVAL_MS = 60_000;
const ACTIVE_SESSION_TTL = 7200; // 2 hours max session

@Injectable()
export class BillingEngineService implements OnModuleDestroy {
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly walletService: WalletService,
    private readonly config: ConfigService,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
  ) { }

  async startBilling(session: ActiveSessionState): Promise<void> {
    await this.cache.set(`session:active:${session.sessionId}`, session, ACTIVE_SESSION_TTL);
    const timer = setInterval(() => this.tick(session.sessionId), BILLING_INTERVAL_MS);
    this.timers.set(session.sessionId, timer);
  }

  async stopBilling(sessionId: string): Promise<{ totalSec: number; totalAmount: number }> {
    const timer = this.timers.get(sessionId);
    if (timer) { clearInterval(timer); this.timers.delete(sessionId); }

    const session = await this.cache.get<ActiveSessionState>(`session:active:${sessionId}`);
    await this.cache.del(`session:active:${sessionId}`);
    if (!session) return { totalSec: 0, totalAmount: 0 };

    const now = Date.now();
    const elapsedSinceLast = Math.floor((now - session.lastBilledAt) / 1000);

    // Pro-rate the partial minute
    if (elapsedSinceLast >= 10) {
      const partialAmount = roundMoney((elapsedSinceLast / 60) * session.ratePerMin);
      const commissionRate = this.config.get<number>('PLATFORM_COMMISSION_RATE') ?? 0.15;
      const { providerEarning } = splitAmount(partialAmount, commissionRate);
      try {
        await this.walletService.debit(session.userId, partialAmount, sessionId, 'Session (final)');
        await this.walletService.credit(session.providerId, providerEarning, sessionId, 'Session earning (final)');
      } catch { /* insufficient balance on final tick — acceptable */ }
    }

    const totalSec = Math.floor((now - session.startedAt) / 1000);
    const totalAmount = roundMoney((totalSec / 60) * session.ratePerMin);
    return { totalSec, totalAmount };
  }

  private async tick(sessionId: string): Promise<void> {
    const session = await this.cache.get<ActiveSessionState>(`session:active:${sessionId}`);
    if (!session) return;

    const commissionRate = this.config.get<number>('PLATFORM_COMMISSION_RATE') ?? 0.15;
    const { providerEarning } = splitAmount(session.ratePerMin, commissionRate);
    const minWarningBalance = session.ratePerMin * 2;

    try {
      const remainingBalance = await this.walletService.debit(
        session.userId, session.ratePerMin, sessionId, 'Session charge (1 min)',
      );
      await this.walletService.credit(session.providerId, providerEarning, sessionId, 'Session earning (1 min)');

      // Update lastBilledAt in cache
      await this.cache.set(`session:active:${sessionId}`, { ...session, lastBilledAt: Date.now() }, ACTIVE_SESSION_TTL);

      if (remainingBalance < minWarningBalance) {
        this.eventBus.emit('billing.low_balance', { sessionId, userId: session.userId, remainingBalance });
      }
    } catch (err: any) {
      if (err?.getStatus?.() === 402) {
        this.eventBus.emit('billing.session_end', { sessionId, userId: session.userId, reason: 'low_balance' });
      }
    }
  }

  onModuleDestroy() {
    for (const timer of this.timers.values()) clearInterval(timer);
    this.timers.clear();
  }
}
