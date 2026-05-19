import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ProvidersService } from '../providers/providers.service';
import { SessionsService } from '../sessions/sessions.service';
import { ModerationService } from '../moderation/moderation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ProviderProfileEntity } from '../providers/entities/provider-profile.entity';
import { PayoutEntity } from '../billing/entities/payout.entity';
import { PlatformConfigEntity } from './entities/platform-config.entity';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly providersService: ProvidersService,
    private readonly moderationService: ModerationService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ProviderProfileEntity) private readonly providerRepo: Repository<ProviderProfileEntity>,
    @InjectRepository(PayoutEntity) private readonly payoutRepo: Repository<PayoutEntity>,
    @InjectRepository(PlatformConfigEntity) private readonly configRepo: Repository<PlatformConfigEntity>,
  ) { }

  async listUsers(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 20, search } = query;
    const qb = this.userRepo.createQueryBuilder('u').orderBy('u.created_at', 'DESC');
    if (search) qb.where('u.phone ILIKE :s OR u.name ILIKE :s', { s: `%${search}%` });
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit, hasNext: page * limit < total };
  }

  async banUser(id: string): Promise<void> { return this.usersService.ban(id); }
  async unbanUser(id: string): Promise<void> { return this.usersService.unban(id); }

  async listProviders(query: { page?: number; limit?: number; approved?: boolean }) {
    const { page = 1, limit = 20, approved } = query;
    const where: any = {};
    if (approved !== undefined) where.isApproved = approved;
    const [data, total] = await this.providerRepo.findAndCount({
      where, relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit, take: limit,
    });
    return { data, total, page, limit, hasNext: page * limit < total };
  }

  async approveProvider(id: string): Promise<void> {
    const profile = await this.providerRepo.findOne({ where: { id } });
    if (!profile) return;
    await this.providerRepo.update(id, { isApproved: true });
    this.notificationsService.sendPush(
      profile.userId,
      'Account Approved',
      'Your provider account has been approved. You can now go online and accept sessions.',
      { type: 'provider_approved' },
    ).catch(() => { });
  }

  async listPayouts(query: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = query;
    const where: any = {};
    if (status) where.status = status;
    const [data, total] = await this.payoutRepo.findAndCount({
      where, order: { createdAt: 'DESC' },
      skip: (page - 1) * limit, take: limit,
    });
    return { data, total, page, limit, hasNext: page * limit < total };
  }

  async processPayout(id: string, bankReference: string): Promise<void> {
    await this.payoutRepo.update(id, { status: 'completed', bankReference, processedAt: new Date() });
  }

  async getConfig(): Promise<PlatformConfigEntity[]> {
    return this.configRepo.find({ order: { key: 'ASC' } });
  }

  async setConfig(key: string, value: any, description?: string): Promise<PlatformConfigEntity> {
    await this.configRepo.upsert({ key, value, description: description ?? null }, ['key']);
    return this.configRepo.findOneOrFail({ where: { key } });
  }
}
