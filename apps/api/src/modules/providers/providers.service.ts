import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderProfileEntity } from './entities/provider-profile.entity';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { CACHE_SERVICE, CacheKeys, ICacheService } from '../../infrastructure/cache/cache.interface';
import { getPaginationOffset, buildPagination } from '@connectify/utils';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(ProviderProfileEntity)
    private readonly repo: Repository<ProviderProfileEntity>,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
  ) { }

  async create(userId: string, dto: CreateProviderProfileDto): Promise<ProviderProfileEntity> {
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing) throw new ConflictException('Provider profile already exists');
    const profile = this.repo.create({ ...dto, userId, isApproved: false });
    return this.repo.save(profile);
  }

  async findById(id: string): Promise<ProviderProfileEntity> {
    const profile = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!profile) throw new NotFoundException(`Provider ${id} not found`);
    return profile;
  }

  async findByUserId(userId: string): Promise<ProviderProfileEntity | null> {
    return this.repo.findOne({ where: { userId } });
  }

  async list(query: { category?: string; page?: number; limit?: number }) {
    const { category, page = 1, limit = 20 } = query;
    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'u')
      .where('p.is_approved = true');

    if (category) qb.andWhere(':cat = ANY(p.categories)', { cat: category });

    // Weighted ranking: 50% quality (avg rating), 30% experience (sessions capped at 200),
    // 20% availability (online now). Computed fully in DB — no application-level sort.
    qb.orderBy(
      '(p.avg_rating / 5.0 * 0.5 + LEAST(p.total_sessions::float / 200, 1) * 0.3 + p.is_online::int * 0.2)',
      'DESC',
    );

    const [data, total] = await qb.skip(getPaginationOffset(page, limit)).take(limit).getManyAndCount();
    return { data, ...buildPagination(page, limit, total) };
  }

  async update(userId: string, dto: UpdateProviderProfileDto): Promise<ProviderProfileEntity> {
    const profile = await this.repo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Provider profile not found');
    Object.assign(profile, dto);
    return this.repo.save(profile);
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await this.repo.update({ userId }, { isOnline });
    if (isOnline) {
      await this.cache.set(CacheKeys.providerOnline(userId), true, 300);
    } else {
      await this.cache.del(CacheKeys.providerOnline(userId));
    }
  }

  async updateRating(providerId: string, newScore: number): Promise<void> {
    const profile = await this.repo.findOne({ where: { id: providerId } });
    if (!profile) return;
    const totalRatings = profile.totalRatings + 1;
    const avgRating = (profile.avgRating * profile.totalRatings + newScore) / totalRatings;
    await this.repo.update(profile.id, {
      avgRating: Math.round(avgRating * 100) / 100,
      totalRatings,
    });
  }

  async submitKyc(userId: string, documentUrl: string): Promise<ProviderProfileEntity> {
    const profile = await this.repo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Provider profile not found');
    if (profile.kycStatus === 'approved') throw new ConflictException('KYC already approved');
    await this.repo.update(profile.id, { kycStatus: 'pending', kycDocumentUrl: documentUrl, kycRejectionReason: null });
    return this.repo.findOne({ where: { id: profile.id } }) as Promise<ProviderProfileEntity>;
  }

  async reviewKyc(
    providerId: string,
    decision: 'approved' | 'rejected',
    rejectionReason?: string,
  ): Promise<ProviderProfileEntity> {
    await this.repo.update(providerId, {
      kycStatus: decision,
      kycRejectionReason: decision === 'rejected' ? (rejectionReason ?? null) : null,
    });
    return this.repo.findOneOrFail({ where: { id: providerId } });
  }
}
