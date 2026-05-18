import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ProvidersService } from '../providers/providers.service';
import { SessionsService } from '../sessions/sessions.service';
import { ModerationService } from '../moderation/moderation.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ProviderProfileEntity } from '../providers/entities/provider-profile.entity';
import { PayoutEntity } from '../billing/entities/payout.entity';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly providersService: ProvidersService,
    private readonly moderationService: ModerationService,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ProviderProfileEntity) private readonly providerRepo: Repository<ProviderProfileEntity>,
    @InjectRepository(PayoutEntity) private readonly payoutRepo: Repository<PayoutEntity>,
  ) {}

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
    await this.providerRepo.update(id, { isApproved: true });
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
}
