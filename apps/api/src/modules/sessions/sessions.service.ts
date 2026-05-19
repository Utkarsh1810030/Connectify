import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from './entities/session.entity';
import { StartSessionDto } from './dto/start-session.dto';
import { ProvidersService } from '../providers/providers.service';
import { BillingEngineService } from '../billing/billing-engine.service';
import { WalletService } from '../billing/wallet.service';
import { CallingService } from '../calling/calling.service';
import { EVENT_BUS, IEventBus } from '../../infrastructure/event-bus/event-bus.interface';
import { CACHE_SERVICE, CacheKeys, ICacheService } from '../../infrastructure/cache/cache.interface';
import { ActiveSessionState, SessionEndReason } from '@connectify/types';
import { splitAmount } from '@connectify/utils';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SessionEntity) private readonly repo: Repository<SessionEntity>,
    private readonly providersService: ProvidersService,
    private readonly billingEngine: BillingEngineService,
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => CallingService)) private readonly callingService: CallingService,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
    private readonly config: ConfigService,
  ) { }

  async create(userId: string, dto: StartSessionDto): Promise<SessionEntity> {
    const provider = await this.providersService.findById(dto.providerId);
    if (!provider.isOnline) throw new BadRequestException('Provider is not online');
    if (!provider.isApproved) throw new BadRequestException('Provider is not approved');

    const rateMap = { chat: provider.chatRatePerMin, voice: provider.voiceRatePerMin, video: provider.videoRatePerMin };
    const ratePerMin = rateMap[dto.type];
    const balance = await this.walletService.getBalance(userId);
    if (balance < ratePerMin * 2) throw new BadRequestException('Insufficient balance. Please top up your wallet.');

    const session = this.repo.create({ userId, providerId: dto.providerId, type: dto.type, ratePerMin, status: 'pending' });
    return this.repo.save(session);
  }

  async start(sessionId: string, userId: string): Promise<SessionEntity & { agoraToken?: string }> {
    const session = await this.findById(sessionId);
    if (session.userId !== userId) throw new BadRequestException('Not your session');
    if (session.status !== 'pending') throw new BadRequestException('Session already started');

    let agoraChannelId: string | null = null;
    let agoraToken: string | null = null;

    if (session.type !== 'chat') {
      agoraChannelId = await this.callingService.createChannel(sessionId);
      agoraToken = await this.callingService.generateToken(agoraChannelId, userId, 'publisher');
    }

    const now = new Date();
    await this.repo.update(sessionId, { status: 'active', startedAt: now, agoraChannelId });

    const activeState: ActiveSessionState = {
      sessionId, userId, providerId: session.providerId,
      type: session.type as any, ratePerMin: Number(session.ratePerMin),
      startedAt: now.getTime(), lastBilledAt: now.getTime(),
      agoraChannelId, agoraToken,
    };
    await this.billingEngine.startBilling(activeState);
    this.eventBus.emit('session.started', { sessionId, userId, providerId: session.providerId, type: session.type });

    return { ...(await this.findById(sessionId)), agoraToken: agoraToken ?? undefined };
  }

  async end(sessionId: string, endReason: SessionEndReason): Promise<SessionEntity> {
    const session = await this.findById(sessionId);
    if (!['active', 'paused'].includes(session.status)) throw new BadRequestException('Session is not active');

    const { totalSec, totalAmount } = await this.billingEngine.stopBilling(sessionId);
    const commissionRate = this.config.get<number>('PLATFORM_COMMISSION_RATE') ?? 0.15;
    const { platformFee, providerEarning } = splitAmount(totalAmount, commissionRate);

    await this.repo.update(sessionId, {
      status: 'completed', endedAt: new Date(), endReason,
      totalDurationSec: totalSec, totalAmount, platformFee, providerEarning,
    });

    if (session.agoraChannelId) await this.callingService.endChannel(session.agoraChannelId);
    this.eventBus.emit('session.ended', { sessionId, userId: session.userId, totalSec, totalAmount, endReason });

    return this.findById(sessionId);
  }

  async findById(id: string): Promise<SessionEntity> {
    const session = await this.repo.findOne({ where: { id } });
    if (!session) throw new NotFoundException(`Session ${id} not found`);
    return session;
  }

  async findByUser(userId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const { buildPagination } = await import('@connectify/utils');
    return { data, ...buildPagination(page, limit, total) };
  }

  async findByProvider(providerId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.repo.findAndCount({
      where: { providerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const { buildPagination } = await import('@connectify/utils');
    return { data, ...buildPagination(page, limit, total) };
  }

  async getActive(userId: string): Promise<ActiveSessionState | null> {
    return this.cache.get<ActiveSessionState>(CacheKeys.activeSession(userId));
  }
}
