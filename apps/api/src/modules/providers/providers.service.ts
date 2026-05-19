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
    const where: Record<string, unknown> = { isApproved: true };
    if (category) where['categories'] = category;
    const [data, total] = await this.repo.findAndCount({
      where,
      relations: ['user'],
      order: { isOnline: 'DESC', avgRating: 'DESC' },
      skip: getPaginationOffset(page, limit),
      take: limit,
    });
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
}
